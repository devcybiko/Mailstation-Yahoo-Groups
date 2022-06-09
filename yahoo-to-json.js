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

function getThreadDictionary(items) {
    let threadDictionary = {};
    let cnt = 1;
    for(let item of items) {
        let thread = threadDictionary[item.hash];
        if (!thread) {
            threadDictionary[item.hash] = item;
            item.replies = []
            item.cnt = cnt;
            cnt += 1;
        } else {
            item.cnt = thread.replies.length;
            thread.replies.push(item);
        }
    }
    return threadDictionary;
}

function findLineNumber(lines, pattern) {
    for(let i=0; i<lines.length; i++) {
        if (lines[i].match(pattern)) return i;
    }
    return null;
}

function findLine(lines, pattern) {
    for(let line of lines) {
        if (line.match(pattern)) return line;
    }
    return null;
}

function fixTopic(subject) {
    if (!subject) return "";
    subject = subject.replaceAll(/\[mailstation\]/gi, "");
    subject = subject.replaceAll(/Subject:/gi, "");
    subject = subject.replaceAll(/Re:/gi, "");
    subject = subject.replaceAll(/  /g, " ");
    subject = subject.replaceAll(/  /g, " ");
    return subject.trim();
}

function createItem(lines) {
    if (!lines) return {};
    if (lines.length === 0) return {};
    let from = findLine(lines, /^From: /)
    let date = findLine(lines, /^Date: /)
    let start = findLineNumber(lines, /^Lines: /);
    let bodyLines = lines.slice(start + 1)
    let subjectLine = findLineNumber(lines, /^Subject: /);
    let subject = lines[subjectLine];
    if (lines[subjectLine+1][0] === " ") {
        subject += lines[subjectLine+1]
    }
    let topic = fixTopic(subject)
    let body = [];
    let lastLine = "";
    for(let bodyLine of bodyLines) {
        bodyLine = bodyLine.trim();
        if (bodyLine.length === 0 && lastLine.length === 0) continue;
        lastLine = bodyLine;
        body.push(bodyLine);
    }
    let item = {from, date, subject, topic, hash: topic.substring(0, 16).toLowerCase(), body}
    return item;
}

function getItems(lines) {
    let items = [];
    let item = []
    for (let line of lines) {
        if (line.startsWith("From nobody@nowhere")) {
            let newItem = createItem(item);
            if (newItem.from) items.push(createItem(item));
            item = [];
        } else {
            item.push(line);
        }
    }
    items.push(createItem(item));
    return items;
}
async function main$(_opts) {
    let opts = _opts || gprocs.args("", "infile*");
    let lines = gfiles.readList(opts.infile);

    let items = getItems(lines);
    let threadDictionary = getThreadDictionary(items);
    let threads = Object.values(threadDictionary).sort((a,b) => a.subject.toLowerCase() > b.subject.toLowerCase());
    let json = JSON.stringify(threads, null, 2);
    console.log(json);
}

module.exports = {main$}

if (module.id === ".") {
    return main$();
}
