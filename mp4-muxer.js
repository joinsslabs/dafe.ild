/**
 * DAFEILD Studio — Pure Node.js ISO-BMFF (.mp4) Video & Full Movie Container Muxer
 * Builds valid MPEG-4 Part 14 (.mp4) single-clip and stitched multi-clip full movie files
 * from one or more JPEG frames so every single shot and stitched movie produces a real .mp4 file on disk.
 */

const fs = require("fs");

function box(type, ...payloads) {
  const body = Buffer.concat(payloads);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length + 8, 0);
  header.write(type, 4, 4, "ascii");
  return Buffer.concat([header, body]);
}

function fullBox(type, version, flags, ...payloads) {
  const vf = Buffer.alloc(4);
  vf.writeUInt8(version, 0);
  vf.writeUIntBE(flags, 1, 3);
  return box(type, vf, ...payloads);
}

function u16(val) {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(val, 0);
  return b;
}

function u32(val) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(val >>> 0, 0);
  return b;
}

function fixed32(val) {
  const b = Buffer.alloc(4);
  b.writeInt32BE(Math.round(val * 65536), 0);
  return b;
}

function fixed16(val) {
  const b = Buffer.alloc(2);
  b.writeInt16BE(Math.round(val * 256), 0);
  return b;
}

const UNITY_MATRIX = Buffer.from([
  0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00
]);

/**
 * Creates a valid MP4 video file on disk at destMp4Path from a JPEG buffer,
 * repeating across `durationSec * fps` samples so media players recognize the full duration.
 */
function createMp4FromJpegBuffer(jpegBuffer, destMp4Path, { width = 1280, height = 720, durationSec = 5, fps = 12 } = {}) {
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const timescale = 1200;
  const frameDelta = Math.round(timescale / fps);
  const totalDuration = totalFrames * frameDelta;

  // ftyp box (isom / mp42)
  const ftyp = box(
    "ftyp",
    Buffer.from("isom", "ascii"),
    u32(512),
    Buffer.from("isomiso2mp41mp42", "ascii")
  );

  // Store the JPEG frame once in mdat and point all sample chunk offsets to it
  // (compact, valid ISO-BMFF sample table)
  const mdat = box("mdat", jpegBuffer);
  const sampleDataOffset = ftyp.length + 8; // byte offset of jpegBuffer inside file

  // mvhd
  const mvhd = fullBox(
    "mvhd",
    0,
    0,
    u32(0), // creation_time
    u32(0), // modification_time
    u32(timescale),
    u32(totalDuration),
    fixed32(1.0), // rate
    fixed16(1.0), // volume
    Buffer.alloc(10), // reserved
    UNITY_MATRIX,
    Buffer.alloc(24), // pre_defined
    u32(2) // next_track_ID
  );

  // tkhd
  const tkhd = fullBox(
    "tkhd",
    0,
    3, // track_enabled | track_in_movie
    u32(0),
    u32(0),
    u32(1), // track_ID
    u32(0),
    u32(totalDuration),
    Buffer.alloc(8),
    u16(0), // layer
    u16(0), // alternate_group
    u16(0), // volume
    u16(0),
    UNITY_MATRIX,
    fixed32(width),
    fixed32(height)
  );

  // mdhd
  const mdhd = fullBox(
    "mdhd",
    0,
    0,
    u32(0),
    u32(0),
    u32(timescale),
    u32(totalDuration),
    u16(0x55c4), // und language
    u16(0)
  );

  // hdlr
  const hdlr = fullBox(
    "hdlr",
    0,
    0,
    u32(0),
    Buffer.from("vide", "ascii"),
    Buffer.alloc(12),
    Buffer.from("DAFIELD Video Handler\0", "ascii")
  );

  // vmhd
  const vmhd = fullBox("vmhd", 0, 1, u16(0), u16(0), u16(0), u16(0));

  // dinf -> dref -> url
  const urlBox = fullBox("url ", 0, 1);
  const dref = fullBox("dref", 0, 0, u32(1), urlBox);
  const dinf = box("dinf", dref);

  // stsd (mp4v / jpeg visual sample entry)
  const compressorName = Buffer.alloc(32);
  compressorName.write("\x0bDAFIELD Mux", 0, "ascii");
  const jpegSampleEntry = box(
    "jpeg",
    Buffer.alloc(6),
    u16(1), // data_reference_index
    u16(0),
    u16(0),
    Buffer.alloc(12),
    u16(width),
    u16(height),
    fixed32(72.0),
    fixed32(72.0),
    u32(0),
    u16(1), // frame_count
    compressorName,
    u16(0x0018),
    u16(0xffff)
  );
  const stsd = fullBox("stsd", 0, 0, u32(1), jpegSampleEntry);

  // stts (Time-to-Sample)
  const stts = fullBox("stts", 0, 0, u32(1), u32(totalFrames), u32(frameDelta));

  // stsc (Sample-to-Chunk: 1 sample per chunk)
  const stsc = fullBox("stsc", 0, 0, u32(1), u32(1), u32(1), u32(1));

  // stsz (Sample Sizes: all frames have size jpegBuffer.length)
  const stsz = fullBox("stsz", 0, 0, u32(jpegBuffer.length), u32(totalFrames));

  // stco (Chunk Offsets: each chunk points to sampleDataOffset)
  const chunkOffsets = Buffer.alloc(totalFrames * 4);
  for (let i = 0; i < totalFrames; i++) {
    chunkOffsets.writeUInt32BE(sampleDataOffset, i * 4);
  }
  const stco = fullBox("stco", 0, 0, u32(totalFrames), chunkOffsets);

  const stbl = box("stbl", stsd, stts, stsc, stsz, stco);
  const minf = box("minf", vmhd, dinf, stbl);
  const mdia = box("mdia", mdhd, hdlr, minf);
  const trak = box("trak", tkhd, mdia);
  const moov = box("moov", mvhd, trak);

  const mp4Buffer = Buffer.concat([ftyp, mdat, moov]);
  fs.writeFileSync(destMp4Path, mp4Buffer);
  return destMp4Path;
}

/**
 * Stitches multiple clips ({ jpegBuffer, durationSec }[]) into a single multi-scene
 * ISO-BMFF .mp4 full movie file on disk at destMp4Path.
 */
function createMultiClipMovieMp4(clipEntries, destMp4Path, { width = 1280, height = 720, fps = 12 } = {}) {
  const validEntries = (clipEntries || []).filter((e) => Buffer.isBuffer(e.jpegBuffer) && e.jpegBuffer.length > 0);
  if (validEntries.length === 0) {
    throw new Error("No valid clip frame buffers provided for movie stitching");
  }

  const timescale = 1200;
  const frameDelta = Math.round(timescale / fps);

  const ftyp = box(
    "ftyp",
    Buffer.from("isom", "ascii"),
    u32(512),
    Buffer.from("isomiso2mp41mp42", "ascii")
  );

  // Concatenate all clip JPEG buffers inside mdat
  const mdatPayload = Buffer.concat(validEntries.map((e) => e.jpegBuffer));
  const mdat = box("mdat", mdatPayload);
  const mdatDataStart = ftyp.length + 8;

  let runningOffset = mdatDataStart;
  const frameSizes = [];
  const frameOffsets = [];

  for (const entry of validEntries) {
    const dur = Math.max(1, Number(entry.durationSec || 5));
    const numFrames = Math.max(1, Math.round(dur * fps));
    const bufLen = entry.jpegBuffer.length;
    for (let i = 0; i < numFrames; i++) {
      frameSizes.push(bufLen);
      frameOffsets.push(runningOffset);
    }
    runningOffset += bufLen;
  }

  const totalFrames = frameSizes.length;
  const totalDuration = totalFrames * frameDelta;

  const mvhd = fullBox(
    "mvhd",
    0,
    0,
    u32(0),
    u32(0),
    u32(timescale),
    u32(totalDuration),
    fixed32(1.0),
    fixed16(1.0),
    Buffer.alloc(10),
    UNITY_MATRIX,
    Buffer.alloc(24),
    u32(2)
  );

  const tkhd = fullBox(
    "tkhd",
    0,
    3,
    u32(0),
    u32(0),
    u32(1),
    u32(0),
    u32(totalDuration),
    Buffer.alloc(8),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    UNITY_MATRIX,
    fixed32(width),
    fixed32(height)
  );

  const mdhd = fullBox(
    "mdhd",
    0,
    0,
    u32(0),
    u32(0),
    u32(timescale),
    u32(totalDuration),
    u16(0x55c4),
    u16(0)
  );

  const hdlr = fullBox(
    "hdlr",
    0,
    0,
    u32(0),
    Buffer.from("vide", "ascii"),
    Buffer.alloc(12),
    Buffer.from("DAFEILD Movie Stitcher\0", "ascii")
  );

  const vmhd = fullBox("vmhd", 0, 1, u16(0), u16(0), u16(0), u16(0));
  const urlBox = fullBox("url ", 0, 1);
  const dref = fullBox("dref", 0, 0, u32(1), urlBox);
  const dinf = box("dinf", dref);

  const compressorName = Buffer.alloc(32);
  compressorName.write("\x0bDAFEILD Mux", 0, "ascii");
  const jpegSampleEntry = box(
    "jpeg",
    Buffer.alloc(6),
    u16(1),
    u16(0),
    u16(0),
    Buffer.alloc(12),
    u16(width),
    u16(height),
    fixed32(72.0),
    fixed32(72.0),
    u32(0),
    u16(1),
    compressorName,
    u16(0x0018),
    u16(0xffff)
  );
  const stsd = fullBox("stsd", 0, 0, u32(1), jpegSampleEntry);
  const stts = fullBox("stts", 0, 0, u32(1), u32(totalFrames), u32(frameDelta));
  const stsc = fullBox("stsc", 0, 0, u32(1), u32(1), u32(1), u32(1));

  // Variable sample size table (sample_size = 0)
  const sampleSizesBuf = Buffer.alloc(totalFrames * 4);
  for (let i = 0; i < totalFrames; i++) {
    sampleSizesBuf.writeUInt32BE(frameSizes[i], i * 4);
  }
  const stsz = fullBox("stsz", 0, 0, u32(0), u32(totalFrames), sampleSizesBuf);

  const chunkOffsetsBuf = Buffer.alloc(totalFrames * 4);
  for (let i = 0; i < totalFrames; i++) {
    chunkOffsetsBuf.writeUInt32BE(frameOffsets[i], i * 4);
  }
  const stco = fullBox("stco", 0, 0, u32(totalFrames), chunkOffsetsBuf);

  const stbl = box("stbl", stsd, stts, stsc, stsz, stco);
  const minf = box("minf", vmhd, dinf, stbl);
  const mdia = box("mdia", mdhd, hdlr, minf);
  const trak = box("trak", tkhd, mdia);
  const moov = box("moov", mvhd, trak);

  const mp4Buffer = Buffer.concat([ftyp, mdat, moov]);
  fs.writeFileSync(destMp4Path, mp4Buffer);
  return {
    destMp4Path,
    totalFrames,
    totalDurationSec: Math.round(totalFrames / fps)
  };
}

module.exports = {
  createMp4FromJpegBuffer,
  createMultiClipMovieMp4
};
