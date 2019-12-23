import React, { useState } from "react";
import Head from "next/head";
import { withRouter } from "next/router";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../utils/scrollController.js";
import Alea from "../utils/alea.js";
import { SwipeTracker } from "../utils/swipeTracker.js";
import { Element, Point, Node, RGBA, HSLA, Timer } from "../utils/dom.js";
import { MultitouchListener, MovementListener, TouchEvents, MouseEvents, TouchListener, TouchHandler } from "../utils/touchHandler.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import Util from "../utils/util.js";
import { TouchCallback, DrawCallback } from "../components/TouchCallback.js";
import getAPI from "../utils/api.js";
import { action, toJS, autorun } from "mobx";
import { inject, observer } from "mobx-react";
import { Article } from "../components/views/article.js";
import LoginForm from "../components/login.js";
import timeSpanFormat from "time-span-format";
import { trkl } from "../utils/trkl.js";
import clipboardCopy from "clipboard-copy";
import axios from "../utils/axios.js";

import tims from "tims";

import "../static/style.css";

const nextTheme =
  '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>name</key>\n\t<string>Next</string>\n\t<key>settings</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>activeGuide</key>\n\t\t\t\t<string>#3333FFFF</string>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#000000</string>\n\t\t\t\t<key>bracketsBackground</key>\n\t\t\t\t<string>#FF00AA66</string>\n\t\t\t\t<key>bracketsOptions</key>\n\t\t\t\t<string>background</string>\n\t\t\t\t<key>caret</key>\n\t\t\t\t<string>#FF0099</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E6E6E6</string>\n\t\t\t\t<key>guide</key>\n\t\t\t\t<string>#33333388</string>\n\t\t\t\t<key>gutter</key>\n\t\t\t\t<string>#6600FF33</string>\n\t\t\t\t<key>invisibles</key>\n\t\t\t\t<string>#404040</string>\n\t\t\t\t<key>lineHighlight</key>\n\t\t\t\t<string>#FF009933</string>\n\t\t\t\t<key>multiEditHighlight</key>\n\t\t\t\t<string>#00FF0022</string>\n\t\t\t\t<key>searchHighlight</key>\n\t\t\t\t<string>#FF00AA99</string>\n\t\t\t\t<key>selection</key>\n\t\t\t\t<string>#00FFFF44</string>\n\t\t\t\t<key>stackGuide</key>\n\t\t\t\t<string>#333333CC</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>bracket.curly</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>bracket.curly</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#FF44AA</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#3399FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>bracket.square</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>bracket.square</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#2266CC</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF8800</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>bracket.round</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>bracket.round</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#9922FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FF00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>bracket.quote</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>bracket.quote</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#00FF00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>comment</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>comment</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#646464FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Invalid</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>invalid</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#FF000022</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>constant</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#3387CCFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Keyword</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E28964</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>constant.numeric</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.numeric</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFFF66</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Storage</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#99CF50</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.modifier</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.modifier</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CF5099</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.self</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.self</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CC0033</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.type</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.type</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CF9950</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Support</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#8A5C8DFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.function</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.function</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#BB00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword control</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.declaration</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.declaration</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#8888AA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.module</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.module</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#FFFF3333</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFFF33</string>\n\t\t\t\t<key>options</key>\n\t\t\t\t<string>underline</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.flow</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.flow</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#110300</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF6600</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.conditional</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.conditional</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.trycatch</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.trycatch</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0033</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.loop</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.loop</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#009999</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.control.switch</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.control.switch</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#999999</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword operator</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.operator</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0080</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Function arg</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.function.argument, variable.parameter, meta.parens.c</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#77FF11</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string></string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.section.embedded</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0D0D0D37</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00D3FFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>keyword.other.unit</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>keyword.other.unit, keyword.unit.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#80FF00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>invalid.illegal</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>invalid.illegal</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#562D56BF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FD5FF1FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.quoted source</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.quoted source</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#DAEFA3</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string constant</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string constant</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CFED81</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.regexp</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.regexp</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#6FFF17</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.definition.string</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.string</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#15151501</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#B4FF82</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.regexp.special</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.regexp constant.character.escape, string.regexp source.ruby.embedded, string.regexp string.regexp.arbitrary-repitition</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00D505</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.regexp punctuation keyword</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.regexp punctuation keyword</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#C559FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string variable</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string variable</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#8A9A95</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.function</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.function</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FCF352FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.tag</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.tag</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#4F9EFFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.tag entity</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.tag entity</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#157EFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>HTML/XML tag attribute value</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.tag string.quoted.double.html</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E07D2C</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>html5 tag</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.tag.block.any.html.html5</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E88BFCFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>html5 tag entity</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.tag.block.any.html.html5 entity</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#D730FAFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.tag.inline</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>source entity.name.tag, source entity.other.attribute-name,meta.tag.inline, meta.tag.inline entity</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#87A7E2FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>html js tag</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>source.js.embedded.html entity.name.tag.script.html</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF3535</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>html js tag braces</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>source.js.embedded.html punctuation.definition.tag.html</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF1E1E</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>html js tag url</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>source.js.embedded.html string.quoted.double.html</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF9D9D</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Attribute</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.other.attribute-name</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#7349BEFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Meta Toc List</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.toc-list</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#162C1AFF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#BEFEC7FF</string>\n\t\t\t\t<key>options</key>\n\t\t\t\t<string>underline</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js variable readwrite</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.initialization, variable.other.readwrite.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF9122</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js variable dollar</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.initialization, variable.other.dollar.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF9122</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js object</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.object.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFEE00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js object with parent</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.property-name.js variable.other.object.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFFF88</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.variable.property.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.variable.property.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#3399FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.other.dot-access</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.dot-access</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#66FFDD</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.other.property.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.property.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#37C1BE</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.section.scope.square.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.section.scope.square.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF2404</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.section.scope.round.js, meta.brace.round</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.section.scope.round.js, meta.brace.round</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#1C38FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.definition.arrow.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.arrow.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#001133</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.arrow.function.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.arrow.function.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#001133</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.language</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.language</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA0044</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.language.prototype</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.language.prototype</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF6600</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.class.error.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.class.error.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF5522</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.class.builtin.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.class.builtin.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFEE00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.class.node.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.class.node.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#1224FE</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.function.node.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.function.node.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#D84014</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.keyword.node.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.keyword.node.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#99EF25</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.import.destructuring.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.import.destructuring.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00BBFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>other.object.key.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>other.object.key.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#1C98C1</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.accessor.js punctuation.definition.parameters</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.accessor.js punctuation.definition.parameters</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#005588</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.type.accessor.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.type.accessor.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#001122</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#0066AA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.module.js, variable.import.parameter.js, variable.other.class.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.module.js, variable.import.parameter.js, variable.other.class.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#220011</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0044</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.type.module.js, storage.type.export.js, storage.type.import.js, storage.type.from.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.type.module.js, storage.type.export.js, storage.type.import.js, storage.type.from.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#222211</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CCCC44</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.type.class.js, storage.type.extends.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.type.class.js, storage.type.extends.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#001122</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#0044AA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.function.call.class.static.js </string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.function.call.class.static.js </string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#880011</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.other.class.static.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.class.static.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA0066</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.accessor.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.accessor.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#001122</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FFCC</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.method.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.method.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#110022</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.method.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.method.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#660099</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>storage.type.function.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>storage.type.function.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#99CC44</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.quoted.single</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.quoted.single</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#88FFAAAA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.other.template-string.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.template-string.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0099</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.template-string.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.template-string.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FF00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.template-string.element</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.template-string.element</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#008800</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.template-string.tag.name.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.template-string.tag.name.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFFF00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.group.braces.square, punctuation.destructuring</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.group.braces.square string.quoted.single, punctuation.destructuring</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#47E9AC</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>string.quoted.double</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#11BB11</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.section.scope.curly.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.section.scope.curly.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F9044E</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.delimiter.comma.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.delimiter.comma.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>meta.group.braces.curly string.quoted.single</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.group.braces.curly string.quoted.single</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#16B853</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support.function</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.function</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#B532FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.definition.string.begin.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.string.begin.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#D2E20C</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>punctuation.definition.string.end.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.string.end.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CEA30D</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>instance constructor</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.class.inheritance, meta.instance.constructor</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic underline</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E81E41</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.class.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.class.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#00FFFF33</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.name.extends.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.name.extends.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#00FF9933</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FF99</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>function call</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.function-call entity.name.function</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#5B24FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>function call with args</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.function-call.function.with-arguments.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#33FF00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js brace</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.brace.curly.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0099</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js paren</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.brace.round.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#000000FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#D0C5FEFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js constant escape</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.character.escape</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#10CF62FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>pseudo-class</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.selector.css entity.other.attribute-name.tag.pseudo-class</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#4FBC4B</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css selectors</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.namespace.unicode.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF4F4F</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>entity.other.attribute-name.id</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.other.attribute-name.id</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0B0028FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F20073FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>class name</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.prototype support.class</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF0099</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>support object</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.object</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFEE00</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>class name prototype</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.prototype support.constant</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF6600</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>prototype declaration</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.prototype.declaration.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>bold</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js undefined</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.language.undefined.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#555588</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>variable.other.constant.js</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>variable.other.constant.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#003311</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#00FF33</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>false</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.language.boolean.false</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AAAA55</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>true</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.language.boolean.true</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CC7744</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>js null</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.language.null.js</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#558855</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css#id punctuation</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.entity.id.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0B0028</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF489F</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css.class</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.other.attribute-name.class, source.css.less entity.other.attribute-name.class.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0B0028</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#9529B8</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css.class puntuation</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.definition.entity.class.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0B0028FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#CD87E4FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css pseudo element</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>entity.other.attribute-name.pseudo-element.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0B0028FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF00FFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css property-name</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.type.property-name.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#B8EFECFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css @at-rule</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.preprocessor.at-rule keyword.control.at-rule</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#D7C271FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css color</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>constant.other.color.rgb-value.css, support.constant.color.w3c-standard-color-name.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FB7720FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css constants</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>support.constant.property-value.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#7CE85EFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Puncation Termination</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>punctuation.terminator, punctuation.separator</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#4BFCF8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>css constructor.argument</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.constructor.argument.css</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#8F9D6AFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>diff.header</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.diff, meta.diff.header, entity.name.namespace</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#0E2231FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>diff.deleted</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.deleted</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#420E09FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>diff.changed</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.changed</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#4A410DFF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>diff.inserted</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.inserted</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#253B22FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Italic</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.italic</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#6AD500FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Underline</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.underline</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E18964FF</string>\n\t\t\t\t<key>options</key>\n\t\t\t\t<string>underline</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Quote</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.quote</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#FEE09C12</string>\n\t\t\t\t<key>fontStyle</key>\n\t\t\t\t<string>italic</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#E1D4B9FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Heading</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.heading, markup.heading entity</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#DE3280FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FFFFFFFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: List</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.list</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#6657EAFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Raw</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup.raw</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#B1B3BA08</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#578BB3FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Comment</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>markup comment</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F67B37FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Markup: Separator</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.separator</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#242424FF</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#60A633FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Log Entry</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.line.entry.logfile, meta.line.exit.logfile</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#EEEEEE29</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>Log Entry Error</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.line.error.logfile</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#751012</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#F8F8F8</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON property top</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.dictionary.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>background</key>\n\t\t\t\t<string>#111111</string>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#1144BB</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON property level 2</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure.dictionary.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#1122BB</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON property level 3</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure.dictionary.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#2938EB</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON property level 4</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure.dictionary.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#6D7EF1</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON property level 5</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure.dictionary.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#B3BBF7</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.dictionary.value.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#AA00AA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value level 2</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure.dictionary.value.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#BF00BF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value level 3</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure.dictionary.value.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF00FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value level 4</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure.dictionary.value.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF40FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value level 5</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure.dictionary.value.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FF80FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON value string punctuation</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.dictionary.value.json string punctuation.definition.string.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#8409FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array value</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.array.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#5522AA</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array value level 1</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure.array.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#7017C8FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array value level 2</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure.array.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#9541E9FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array value level 3</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure.array.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#BA83F1FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array value level 4</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure meta.structure.array.json string.quoted.double</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#DFC6F9FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON prop string punctuation</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.dictionary.json string punctuation.definition.string</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#66BBDDFF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array string puntuation</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.array.json string punctuation.definition.string</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#416BE9FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON array brackets</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.array.json punctuation.definition.array</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FCC401FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t\t<dict>\n\t\t\t<key>name</key>\n\t\t\t<string>JSON object braces</string>\n\t\t\t<key>scope</key>\n\t\t\t<string>meta.structure.dictionary.json punctuation.definition.dictionary</string>\n\t\t\t<key>settings</key>\n\t\t\t<dict>\n\t\t\t\t<key>foreground</key>\n\t\t\t\t<string>#FEDF76FF</string>\n\t\t\t</dict>\n\t\t</dict>\n\t</array>\n\t<key>uuid</key>\n\t<string>b238c753-1549-3f12-a519-0faa5dcd4f65</string>\n</dict>\n</plist>';

const rng = Alea.singleton(Date.now());
const imagePaths = lazyInitializer(() => randomImagePaths());

const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

function EditColorScheme(xml = global.window.nt) {
  let nodes = [...xml.querySelectorAll("string")].filter(e => /#[0-9A-Fa-f]/.test(e.innerHTML)).map(e => ({ element: e.parentElement, cnode: e }));

  function getPath(node, path = []) {
    let p = null;
    if(node.tagName == "string") {
      p = node.previousElementSibling;
    } else if(node.tagName == "dict") {
      {
        let parent = node.parentElement ? node.parentElement.firstElementChild : null;
        if(parent.innerHTML == "name") p = parent.nextElementSibling;
      }
    }
    /* if(p == null) 
    console.log("node: ", node.parentElement);   
*/
    if(p == null) return path;
    path.unshift(p.innerHTML);
    return getPath(p.parentElement, path);
  }
  nodes.forEach(node => {
    let color = new RGBA(node.cnode.innerHTML);
    let knode = node.cnode.previousSibling;

    let hsla = new HSLA(Util.randInt(0, 360, rng), 100, 50, 1.0);
    let rgba = hsla.toRGBA(); //new RGBA(Util.randInt(0, 1) * 255, Util.randInt(0, 1) * 255, Util.randInt(0, 1) * 255, 255);

    const path = getPath(node.cnode).join("/");

    const newColor = /background/i.test(path) ? "#000" : RGBA.toHex(hsla.toRGBA()); /*.slice(0, 7)*/
    node.cnode.innerHTML = newColor;
    //console.log(knode);
    console.log(path + ": ", rgba, hsla);
  });
  const s = new XMLSerializer();
  const text = s.serializeToString(xml);

  const tnode = document.createTextNode(text);

  const ta = Element.create("textarea", { rows: 10, cols: 80 });
  document.body.insertBefore(ta, document.body.firstChild);
  ta.appendChild(tnode);
  ta.select();
  document.execCommand("copy");

  // clipboardCopy(text);
  return { xml, text };
}

@inject("rootStore")
@observer
//@withRouter
class Home extends React.Component {
  state = {
    mirrored: false,
    angle: 0
  };
  svgLayer = trkl();

  constructor(props) {
    super(props);
    const { rootStore } = this.props;
    rootStore.setState({ subpage: 1 });
    if(global.window) {
      window.page = this;
      window.rs = rootStore;
      window.rng = rng;
      window.axios = axios;
      const parser = new DOMParser();
      window.nt = parser.parseFromString(nextTheme, "text/xml");
      window.EditColorScheme = EditColorScheme;
    }
    this.getHash();

/*    this.svgLayer.subscribe(newLayer => {
      console.log("svgLayer: ", newLayer);
    });
    const svgRef = this.svgLayer;
    const page = this;
    this.touchListener = TouchHandler(DrawCallback(svgRef),
      {
        element: global.window,
        step: 10,
        round: false,
        listener: MovementListener,
        noscroll: true
      }
    );*/
  }

  readHash() {
    if(global.window) {
      const hash = /#/.test(window.location.href) ? window.location.href.replace(/.*#/, "") : "1";
      const subpage = parseInt(hash);
      return subpage;
    }
    return 1;
  }

  getHash() {
    const { rootStore, router } = this.props;
    if(global.window) {
      const subpage = this.readHash();
      if(!isNaN(subpage)) {
        if(subpage != rootStore.state.subpage) {
          rootStore.setState({ subpage });
          this.forceUpdate();
        }
      }
    } else {
      console.log("query: ", router.query);
    }
  }
  /**
   * { function_description }
   */
  componentDidMount() {
    const { rootStore, router } = this.props;
    console.log("Home.componentDidMount ");
    this.getHash();
    var counter = 0;
    Timer.interval(1000, () => {
      counter++;
      if(counter % 3 == 0) {
        rootStore.setState({
          mirrored: !rootStore.state.mirrored
        });
      }
      this.forceUpdate();
    });
  }

  componentDidUpdate(prevProps) {
    const { pathname, query } = this.props.router;
    /*  if(query !== prevProps.router.query) {
      this.getHash();
    }*/
  }

  handleNext = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage + 1 });
    if(global.window) window.location.hash = `#${subpage + 1}`;
    //this.forceUpdate();
  };

  handlePrev = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage - 1 });
    if(global.window) window.location.hash = `#${subpage - 1}`;
    //this.forceUpdate();
  };

  render() {
    const { rootStore, router } = this.props;
    let swipeEvents = {};
    var e = null;
    if(global.window !== undefined) window.page = this;

    const t = ` perspective(100vw) scaleX(${rootStore.state.mirrored ? -1 : 1})`; // `rotateZ(${rootStore.state.angle}deg) ` + (rootStore.state.mirrored ? " rotateY(-180deg) " : "");
    const endDate = new Date("01.01.2035");
    const now = new Date();

    const seconds = (endDate.getTime() - now.getTime()) / 1000;

    //const timespan = tims.text(, {    lang: "fr"   }); /*.split(/,/g).slice(0, 2).join(', ')*/
    const timespan = Util.timeSpan(Math.floor(seconds));

    const subpage = this.readHash(); //rootStore.state.subpage;
    //console.log("Home.render", { subpage });
    return (
      <div className={"main-layout"}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={"subpage flex-vertical"} style={{ opacity: subpage == 1 ? 1 : 0, display: subpage == 1 ? "flex" : "flex" }}>
          <div style={{ transformStyle: "preserve-3d", transform: t }}>
            <img src={"/static/img/logo-transparent.png"} style={{ width: "100%", maxWidth: "1280px" }} />
          </div>
          {/*  <img src={"/static/img/arrow-next.svg"} style={{ transform: 'scaleX(-1)' }} />*/}
        </div>
        <div className={"subpage"} style={{ opacity: subpage == 2 ? 1 : 0, display: subpage == 2 ? "block" : "block" }}>
          <h1>Title</h1>
          <span className={"paragraph"}>
            The earliest known appearance of the phrase is from The Boston Journal. In an article titled "Current Notes" in the February 9, 1885, edition, the phrase is mentioned as a good practice
            sentence for writing students: "A favorite copy set by writing teachers for their pupils is the following, because it contains every letter of the alphabet: 'A quick brown fox jumps over
            the lazy dog.'" Dozens of other newspapers published the phrase over the next few months, all using the version of the sentence starting with "A" rather than "The". The earliest known use
            of the phrase in its modern form (starting with "The") is from the 1888 book Illustrative Shorthand by Linda Bronson. The modern form (starting with "The") became more common despite the
            fact that it is slightly longer than the original (starting with "A"). As the use of typewriters grew in the late 19th century, the phrase began appearing in typing lesson books as a
            practice sentence. Early examples include How to Become Expert in Typewriting: A Complete Instructor Designed Especially for the Remington Typewriter (1890), and Typewriting Instructor and
            Stenographer's Hand-book (1892). By the turn of the 20th century, the phrase had become widely known. In the January 10, 1903, issue of Pitman's Phonetic Journal, it is referred to as "the
            well known memorized typing line embracing all the letters of the alphabet".{" "}
            {/*Robert Baden-Powell's book Scouting for Boys (1908) uses the phrase as a practice sentence for signaling. The
            first message sent on the Moscow–Washington hotline on August 30, 1963, was the test phrase "THE QUICK BROWN FOX JUMPED OVER THE LAZY DOG'S BACK 1234567890". Later, during testing, the
            Russian translators sent a message asking their American counterparts, "What does it mean when your people say 'The quick brown fox jumped over the lazy dog'?" During the 20th century,
            technicians tested typewriters and teleprinters by typing the sentence.*/}
          </span>
        </div>
        <div className={"subpage flex-vertical"} style={{ opacity: subpage == 3 ? 1 : 0, display: subpage == 3 ? "flex" : "flex" }}>
          <div className={"time-counter"}>{timespan}</div>
        </div>
        {subpage > 1 ? (
          <a className={"button-prev"} href={"#" + (subpage - 1)} onClick={this.handlePrev}>
            <img src={"/static/img/arrow-next.svg"} style={{ transform: "scaleX(-1)" }} />
          </a>
        ) : (
          undefined
        )}
        <a className={"button-next"} href={subpage < 3 ? "#" + (subpage + 1) : "/show"} onClick={subpage >= 3 ? undefined : this.handleNext}>
          <img src={"/static/img/arrow-next.svg"} />
        </a>
        <SvgOverlay svgRef={this.svgLayer} />

        <style jsx global>{`
          h1 {
            text-align: left;
          }
          span.paragraph {
            font-size: 2em;
          }
          .article-list {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .button-next {
            position: fixed;
            right: 10px;
            bottom: 10px;
          }
          .button-prev {
            position: fixed;
            left: 10px;
            bottom: 10px;
          }
          .button-next,
          .button-prev {
            filter: drop-shadow(-2px 2px 4px #00000080);
          }
          .button-next:active,
          .button-prev:active {
            transform: translate(2px, 2px);
          }
          .flex-vertical {
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .subpage {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            font-size: 2vw;

            transition: opacity 0.5s;
            padding: 0 10px 0 10px;
            overflow: auto;
          }

          .main-layout {
            display: block;
            padding: 0;
            margin: 0;
            overflow: ĥidden;
          }
          .time-counter {
            margin: 10px;
            font-size: 2em;
          }
          .gallery-image {
            height: auto;
          }
          .panels {
            margin: 100px;
            overflow: visible;
          }
          img {
            border: 0px;
            outline: 0px;
            padding: 0px;
            margin: 0px;
          }
        `}</style>
      </div>
    );
  }
}

export default Home;
