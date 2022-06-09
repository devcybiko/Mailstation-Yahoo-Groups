#!/usr/bin/env node

/** 
 * template for a main.js file
 **/

const glstools = require('glstools');
const gprocs = glstools.procs;
const gstrings = glstools.strings;
const gfiles = glstools.files;
const fs = require("fs");
const path = require("path");

async function main$(_opts) {
    let opts = _opts || gprocs.args("--bucket=devcybiko.s3,--outdir=metadata,--prefix=Music/Music,--file=", "indir*");
}

module.exports = {main$}

if (module.id === ".") {
    return main$();
}
