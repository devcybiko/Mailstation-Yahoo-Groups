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

let header;
let footer;

function formatDate(s) {
    s = s.replaceAll("Date: ", "").trim();
    let d = Date.parse(s)
    let x = new Date(d).toLocaleDateString('en-us', { month:"short", day:"numeric", year:"numeric", }) 

    return x;
}
function makeFname(s) {
    s = s.replaceAll(/[^a-zA-Z0-9 ]/g, "")
    s = s.replaceAll(" ", "_");
    return s+".html";
}
function clean(s) {
    if (s === undefined) return "undefined";
    s = s.replaceAll(/[<]/g, "&lt;");
    return s;
}
function toTag(tag, clazz, s, cleanit=true) {
    if (cleanit)
        return `<${tag} class="${clazz}">${clean(s)}</${tag}>\n`;
    else
        return `<${tag} class="${clazz}">${s}</${tag}>\n`;
}



function fromBase64(s) {
    let buff = new Buffer(s, 'base64');
    return buff.toString();
}
function formatBody(thread) {
    let result = "";
    for(let i=0; i<thread.body.length; i++) {
        let line = thread.body[i];
        line = line.trim();
        if (line.startsWith("--")) continue;
        if (line.startsWith(">")) continue;
        if (line.startsWith("<")) continue;
        if (line.includes("Content-Type")) continue;
        if (line.includes("Content-Transfer-Encoding: quoted-printable")) continue;
        let http = line.indexOf("http://") + 1;
        let https = line.indexOf("https://") + 1;
        let base64 = line.indexOf("Content-Transfer-Encoding: base64")+1
        if (http || https) {
            let i = (http || https)-1;
            let sp = line.substring(i).indexOf(" ")+1 || line.length;
            let newline = line.substring(0, i);
            newline += '<a target="_blank" href="';
            newline += line.substring(i, sp);
            newline += '">(URL)</a>';
            newline += line.substring(sp);
            line = newline;
        } else if (base64) {
            base64 = "";
            for(let j=i+2; j<thread.body.length; j++) {
                line = thread.body[j].trim(); 
                i=j
                if (line === "") break;
                base64 += line;
            }
            console.error("base64", base64);
            line = clean(fromBase64(base64));
            line = line.replaceAll(/\n/g, "<br>\n");
        } else {
            line = clean(line);
        }
        if (line.length > 250) line = "//--unintelligible--//"
        result += line+"<br>\n";
    }
    thread.formattedBody = result;
}
function toHTML(thread, includeCnt=true) {
    formatBody(thread);
    let html = "<hr>";
    if (includeCnt) {
        html += `<h3 id="${thread.cnt+1}">${thread.cnt+1}: ${thread.subject}</h3>\n<a href="#0">(top)</a>`
    } else {
        html += `<h3>${thread.subject}</h3>\n`
    }
    html += toTag("p", "from", thread.from)
    html += toTag("p", "date", formatDate(thread.date))
    html += toTag("p", "formattedBody", thread.formattedBody, false)
    return html;
}

function makeIndex(threads) {
    let html = `<h1>Mailstation Yahoo Groups Archive</h1>\n<ol>\n`;
    for(let thread of threads) {
        let page = makeFname(thread.topic);
        html += `<li><a class="link" href="${page}"><b>${thread.topic}</b> (${thread.from}) ${formatDate(thread.date)}</a>\n`;
        if (thread.replies) {
            html += "<ol>\n";
            for(let reply of thread.replies) {
                html += `<li><a class="link" href="${page}#${reply.cnt+1}">${reply.subject} (${reply.from} ${formatDate(reply.date)})</a></li>\n`;
            }
            html += "</ol>\n"
        }
        html += "</li>\n"
    }
    return html;
}

function makePage(thread) {
    let html = `<h1 id="0">${thread.topic} (${formatDate(thread.date)})</h1>`;
    html += `<a href="index.html">(home)</a>`;
    html += `<hr><ol>\n`;
    for(let reply of thread.replies) {
        html += `<li><a class="link" href="#${reply.cnt+1}">${reply.from} ${formatDate(reply.date)}</a></li>\n`;
    }
    html += "</ol><hr>\n";
    html += toHTML(thread, false);
    for(let reply of thread.replies) {
        html += toHTML(reply, true);
    }
    return html;
}

function writeHTML(fname, body) {
    let html = header + "\n" + body + "\n" + footer;
    gfiles.write(`html/${fname}`, html);
}
async function main$(_opts) {
    let opts = _opts || gprocs.args("", "infile*");
    header = gfiles.read("html-head.html");
    footer = gfiles.read("html-footer.html");
    let threads = gfiles.readJSON(opts.infile);
    let index = makeIndex(threads);
    writeHTML("index.html", index);
    for(let thread of threads) {
        let html = makePage(thread);
        let fname = makeFname(thread.topic);
        console.log(fname);
        writeHTML(fname, html);    
    }
}

module.exports = {main$}

if (module.id === ".") {
    return main$();
}
