"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  BoonDrawSVG: () => BoonDrawSVG
});
module.exports = __toCommonJS(src_exports);

// src/BoonDrawSVG.ts
var import_uuid = require("uuid");
var import_xmldom = require("xmldom");

// src/utils/utils.ts
var import_text_to_svg = __toESM(require("text-to-svg"));

// src/constants/constants.ts
var DEFAULT_FONT_SIZE = 50;

// src/utils/utils.ts
var cssParse = require("css/lib/parse");
var extractFontInfos = (fontFaceString) => {
  const result = cssParse(fontFaceString);
  const fontFaces = result.stylesheet?.rules.filter(
    (rule) => rule.type === "font-face" && rule.declarations
  );
  if (!fontFaces)
    return null;
  const fontInfos = fontFaces.map((fontFace) => {
    return fontFace.declarations.map((declaration) => {
      const { property, value } = declaration;
      if (property && value && ["font-family", "src"].includes(property)) {
        return { property, value };
      }
    }).filter((v) => !!v);
  });
  return fontInfos;
};
var extractContentFromURL = (urlString) => {
  const urlRegex = /url\((['"])?(.*?)\1\)/;
  const match = urlString.match(urlRegex);
  return match ? match[2] : null;
};
var getFontInfoFromFontFace = (document, fontFamily) => {
  const styleTags = document.getElementsByTagName("style");
  const styleTag = styleTags.item(0);
  const fontFaceString = styleTag?.textContent;
  if (!fontFaceString)
    return;
  const fontInfos = extractFontInfos(fontFaceString);
  const fontInfo = fontInfos?.find(
    (fontInfo2) => fontInfo2.find((font) => font.property === "font-family" && font.value === fontFamily)
  );
  if (!fontInfo)
    return;
  const result = fontInfo.reduce((prev, next) => {
    prev[next.property] = next.value;
    return prev;
  }, {});
  return result;
};
var loadTextToSvg = (fontURL) => {
  return new Promise((resolve, reject) => {
    return import_text_to_svg.default.load(fontURL, (error, textToSvg) => {
      if (error || !textToSvg) {
        return reject(error);
      }
      return resolve(textToSvg);
    });
  });
};
var getFontScaleFromFontSize = (fontSize) => fontSize / DEFAULT_FONT_SIZE;
var getCanvasSize = (document) => {
  const svgElement = document.documentElement;
  const viewBox = svgElement.getAttribute("viewBox");
  if (!viewBox)
    return;
  const [, , canvasWidthString, canvasHeightString] = viewBox.split(" ");
  const [canvasWidth, canvasHeight] = [+canvasWidthString, +canvasHeightString];
  return { canvasWidth, canvasHeight };
};
var getTextYPosition = (textElement) => {
  const yString = textElement.getAttribute("y");
  if (yString === null)
    return;
  return +yString;
};
var getFontStyles = (textElement) => {
  const fontFamily = textElement.getAttribute("font-family");
  const fontSizeString = textElement.getAttribute("font-size");
  const letterSpacingString = textElement.getAttribute("letter-spacing");
  if (!fontFamily)
    throw new Error(`font-family\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. ${textElement}`);
  if (!fontSizeString)
    throw new Error(`font-size\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. ${textElement}`);
  if (!letterSpacingString)
    throw new Error(`letter-spacing\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. ${textElement}`);
  const fontSize = +fontSizeString;
  const letterSpacing = +letterSpacingString;
  return { fontFamily, fontSize, letterSpacing };
};
var getFontStyleOption = ({
  fontSize,
  letterSpacing,
  scale
}) => {
  return {
    x: 0,
    y: 0,
    fontSize,
    anchor: "center top",
    kerning: true,
    letterSpacing: 1 / fontSize * (letterSpacing * scale)
  };
};

// src/BoonDrawSVG.ts
var BoonDrawSVG = class {
  serializer = new import_xmldom.XMLSerializer();
  originalTextElementMap = /* @__PURE__ */ new Map();
  documentMap = /* @__PURE__ */ new Map();
  textToSvgMap = /* @__PURE__ */ new Map();
  /**
   * 주어진 document에서 주어진 targetId와 일치하는 요소를 반환합니다.
   *
   * @param document Document - 요소를 검색할 Document 객체
   * @param targetId string - 검색할 요소의 ID
   * @param options GetElementByIdOptions - getElementByIdOptions에 대한 선택적 옵션
   * @returns Element | null - 주어진 ID와 일치하는 요소 또는 null (찾지 못한 경우)
   */
  getElementById(document, targetId, options) {
    const element = Array.from(document.getElementsByTagName(options.qualifiedName ?? "*")).find((element2) => element2.getAttribute("id") === targetId);
    if (element) {
      return element;
    }
    return null;
  }
  /**
   * 주어진 document에서 주어진 targetId와 일치하는 SVGTextElement를 반환합니다.
   *
   * @param document Document - 요소를 검색할 Document 객체
   * @param targetId string - 검색할 요소의 data-role
   * @returns SVGTextElement | null - 주어진 data-role와 일치하는 요소 또는 null (찾지 못한 경우)
   */
  getBrandNameTextElement(document, targetId) {
    const textElement = Array.from(document.getElementsByTagName("text")).find((element) => element.getAttribute("data-role") === targetId);
    return textElement ?? null;
  }
  /**
   * 주어진 요소의 모든 자식을 제거합니다.
   *
   * @param element Element - 자식을 제거할 요소
   */
  removeAllChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  /**
   * 주어진 SVG 문자열을 파싱하여 새로운 Document 객체를 반환합니다.
   *
   * @param svgString string - 파싱할 SVG 문자열
   * @returns Document - 생성된 Document 객체
   */
  createDocument(svgString) {
    const parser = new import_xmldom.DOMParser();
    const document = parser.parseFromString(svgString, "image/svg+xml");
    return document;
  }
  /**
   * 주어진 키와 대상 ID를 사용하여 원본 SVG 텍스트 요소를 가져옵니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @returns 대상 ID에 해당하는 SVG 텍스트 요소 또는 null (찾지 못한 경우)
   */
  getOriginalTextElementInfo(key) {
    if (this.originalTextElementMap.has(key)) {
      const originalTextElement = this.originalTextElementMap.get(key);
      const lastChildDy = originalTextElement.lastChild.getAttribute("dy");
      const childNodesLength = originalTextElement.childNodes.length;
      const textYPosition = getTextYPosition(originalTextElement);
      const fontStyles = getFontStyles(originalTextElement);
      const childNodesTextContent = Array.from(originalTextElement.childNodes).map((node) => node.textContent);
      return {
        lastChildDy,
        childNodesLength,
        textYPosition,
        fontStyles,
        childNodesTextContent
      };
    }
    return null;
  }
  /**
   * getTextToSvg 함수는 주어진 Document와 폰트 패밀리에 대한 TextToSVG 인스턴스를 비동기적으로 가져옵니다.
   *
   * @param document - Document 객체
   * @param fontFamily - 폰트 패밀리
   * @returns Promise<TextToSVG | undefined> - TextToSVG 인스턴스 또는 undefined (실패 시)
   */
  async getTextToSvg(document, fontFamily) {
    if (this.textToSvgMap.has(fontFamily)) {
      return this.textToSvgMap.get(fontFamily);
    }
    const fontInfo = getFontInfoFromFontFace(document, fontFamily);
    if (fontInfo === void 0)
      throw new Error("@font-face\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const fontURL = extractContentFromURL(fontInfo.src);
    if (fontURL === null)
      throw new Error("font url\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const textToSvg = await loadTextToSvg(fontURL);
    if (textToSvg === null)
      throw new Error("\uD3F0\uD2B8\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    return textToSvg;
  }
  /**
   * getMetrics 함수는 주어진 Document, 텍스트, 폰트 패밀리, 폰트 크기, 글자 간격에 대한 TextToSVG.Metrics를 비동기적으로 가져옵니다.
   *
   * @param document - Document 객체
   * @param text - 텍스트
   * @param fontFamily - 폰트 패밀리
   * @param fontSize - 폰트 크기
   * @param letterSpacing - 글자 간격
   * @returns Promise<TextToSVG.Metrics | undefined> - Metrics 객체 또는 undefined(실패)
   */
  async getMetrics(document, text, fontFamily, fontSize, letterSpacing) {
    const textToSvg = await this.getTextToSvg(document, fontFamily);
    if (!textToSvg)
      throw new Error("Text To Svg\uB97C \uAD6C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const scale = getFontScaleFromFontSize(fontSize);
    const options = getFontStyleOption({ fontSize, letterSpacing, scale });
    const metrics = textToSvg.getMetrics(text, options);
    this.textToSvgMap.set(fontFamily, textToSvg);
    return metrics;
  }
  /**
   * getUpdatedBrandNameDy 함수는 주어진 프로퍼티를 사용하여 브랜드 이름의 dy 값을 업데이트합니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param targetId - 업데이트할 텍스트 요소의 대상 ID
   * @returns number | undefined - 업데이트된 dy 값 또는 undefined (실패 시)
   */
  getUpdatedBrandNameDy({
    key
  }) {
    const originalTextElementInfo = this.getOriginalTextElementInfo(key);
    if (!originalTextElementInfo)
      return void 0;
    const { lastChildDy, childNodesLength } = originalTextElementInfo;
    if (!lastChildDy || !childNodesLength)
      return void 0;
    const dy = +lastChildDy * (childNodesLength - 1) / childNodesLength;
    return dy;
  }
  /**
   * getUpdatedBrandNameY 함수는 주어진 프로퍼티를 사용하여 브랜드 이름의 Y 좌표를 업데이트합니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param document - SVG 문서
   * @param targetId - 업데이트할 텍스트 요소의 대상 ID
   * @param brandName - 업데이트할 브랜드 이름
   * @param fontSize - 브랜드 이름의 폰트 크기
   * @returns Promise<number | undefined> - 업데이트된 Y 좌표 값 또는 undefine
   */
  async getUpdatedBrandNameY({
    key,
    document,
    targetId,
    brandName,
    fontSize
  }) {
    const canvasSize = getCanvasSize(document);
    if (canvasSize === void 0)
      return;
    const originalTextElementInfo = this.getOriginalTextElementInfo(key);
    const textElement = this.getBrandNameTextElement(document, targetId);
    if (!originalTextElementInfo)
      return;
    if (!textElement)
      return;
    const { textYPosition: originalTextYPosition, fontStyles: originalFontStyles } = originalTextElementInfo;
    const fontStyles = getFontStyles(textElement);
    if (!originalTextYPosition)
      return;
    if (!originalFontStyles)
      return;
    if (!fontStyles)
      return;
    const originalY = originalTextYPosition;
    const { fontSize: originalFontSize } = originalFontStyles;
    const { fontFamily, letterSpacing } = fontStyles;
    const metrics = await this.getMetrics(
      document,
      brandName,
      fontFamily,
      fontSize,
      letterSpacing
    );
    const metricsForCenter = await this.getMetrics(
      document,
      brandName,
      fontFamily,
      originalFontSize,
      letterSpacing
    );
    if (metrics === void 0)
      return;
    if (metricsForCenter === void 0)
      return;
    if (originalY === void 0)
      return;
    const centerY = (originalY + metricsForCenter.height / 2) / canvasSize.canvasHeight;
    const newY = canvasSize.canvasHeight * centerY - metrics.height / 2;
    return newY;
  }
  /**
   * getAdjustedFontStyles 함수는 주어진 프로퍼티를 사용하여 조정된 폰트 스타일을 비동기적으로 가져옵니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param document - Document 객체
   * @param targetId - 대상 요소의 ID
   * @param brandName - 브랜드 이름
   * @returns Promise<GetAdjustedFontSizeResult | undefined> - 조정된 폰트 크기 및 글자 간격 객체 또는 undefined (실패 시)
   */
  async getAdjustedFontStyles({
    key,
    document,
    targetId,
    brandName
  }) {
    const textElement = this.getBrandNameTextElement(document, targetId);
    const originalTextElementInfo = this.getOriginalTextElementInfo(key);
    if (!textElement || !originalTextElementInfo)
      throw new Error(`data-role\uAC00 ${targetId}\uC778 element\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
    const fontStyles = getFontStyles(textElement);
    const { fontFamily, fontSize, letterSpacing } = fontStyles;
    const scale = getFontScaleFromFontSize(fontSize);
    const textToSvg = await this.getTextToSvg(document, fontFamily);
    if (textToSvg === void 0)
      throw new Error("\uD3F0\uD2B8\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const options = getFontStyleOption({ fontSize, letterSpacing, scale });
    const biggestWidth = Math.max(
      ...originalTextElementInfo.childNodesTextContent.map((textContent) => textToSvg.getMetrics(textContent ?? brandName, options).width)
    );
    const { width: currentWidth } = textToSvg.getMetrics(brandName, options);
    if (biggestWidth < currentWidth) {
      const changedScale = biggestWidth / currentWidth;
      return { fontSize: fontSize * changedScale, letterSpacing: letterSpacing * changedScale };
    }
    return { fontSize, letterSpacing };
  }
  /**
   * updateBrandName 함수는 주어진 프로퍼티를 사용하여 브랜드 이름을 업데이트합니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param targetId - 대상 요소의 ID
   * @param brandName - 업데이트할 브랜드 이름
   * @returns Promise<BoonDrawSVG> - 업데이트된 BoonDrawSVG 객체 또는 현재 객체 (실패 시)
   */
  async updateBrandName({
    key,
    targetId,
    brandName
  }) {
    const document = this.getDocument(key);
    const textElement = this.getBrandNameTextElement(document, targetId);
    const firstChild = textElement?.firstChild;
    if (!textElement)
      throw new Error("\uD14D\uC2A4\uD2B8 \uC5D8\uB9AC\uBA3C\uD2B8\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: " + key);
    if (!firstChild)
      throw new Error("\uD14D\uC2A4\uD2B8 \uC5D8\uB9AC\uBA3C\uD2B8\uC758 \uCCAB\uBC88\uC9F8 \uB178\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: " + key);
    const cloneNode = firstChild.cloneNode();
    const adjustedFontStyles = await this.getAdjustedFontStyles({
      key,
      document,
      targetId,
      brandName
    });
    if (adjustedFontStyles === void 0)
      return this;
    const { fontSize, letterSpacing } = adjustedFontStyles;
    const updatedY = await this.getUpdatedBrandNameY({
      key,
      document,
      targetId,
      brandName,
      fontSize
    });
    const updatedDy = this.getUpdatedBrandNameDy({
      key
    });
    if (updatedY === void 0 || updatedDy === void 0)
      return this;
    cloneNode.textContent = brandName;
    cloneNode.setAttribute("dy", `${updatedDy}`);
    cloneNode.setAttribute("font-size", `${fontSize}`);
    cloneNode.setAttribute("letter-spacing", `${letterSpacing}`);
    textElement.setAttribute("y", `${updatedY}`);
    this.removeAllChildren(textElement);
    textElement.appendChild(cloneNode);
    return this;
  }
  /**
   * getDocument 함수는 현재 객체(this)의 문서(document)를 반환합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @throws {Error} 만약 문서(document)가 초기화되지 않았을 경우 에러를 던집니다.
   * @returns {Document} 현재 객체(this)의 문서(document)를 반환합니다.
   */
  getDocument(key) {
    if (!this.documentMap.has(key)) {
      throw new Error("Document \uBB38\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
    return this.documentMap.get(key);
  }
  /**
   * getSvgString 함수는 현재 객체(this)의 문서(document)를 문자열 형태의 SVG로 직렬화하여 반환합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {string} 문서(document)를 문자열 형태의 SVG로 직렬화한 결과를 반환합니다.
   */
  getSvgString(key) {
    const serializedSvg = this.serializer.serializeToString(this.getDocument(key));
    return serializedSvg;
  }
  /**
   * setFullWidth 함수는 SVG 문서 요소의 너비와 높이를 100%로 설정합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {BoonDrawSVG} 현재 객체(this)를 반환합니다.
   */
  setFullWidth(key) {
    const documentElement = this.getDocument(key).documentElement;
    documentElement.setAttribute("width", "100%");
    documentElement.setAttribute("height", "100%");
    return this;
  }
  /**
   * setUniqueId 함수는 SVG 문자열 내의 모든 요소의 ID를 고유한 값으로 대체합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {string} 새로운 SVG 문자열
   */
  replaceUniqueId(key, svgString) {
    const uniqueKey = (0, import_uuid.v4)();
    const document = this.createDocument(svgString);
    const allElements = document.getElementsByTagName("*");
    const elementsHaveId = Array.from(allElements).filter((element) => element.getAttribute("id"));
    let newSvgString = svgString;
    elementsHaveId.forEach((element, index) => {
      const id = element.getAttribute("id");
      newSvgString = newSvgString.replace(new RegExp(id, "gi"), `${key}_${uniqueKey}_${index}`);
    });
    return newSvgString;
  }
  /**
   * init 메서드는 주어진 키와 SVG 문자열, 대상 요소의 ID를 사용하여 BoonDrawSVG 객체를 초기화합니다.
   *
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @param {string} svgString - SVG 형식의 문자열 데이터
   * @param {string} targetId - 초기화할 텍스트 요소의 대상 ID
   * @returns {BoonDrawSVG} - 이 메서드를 호출한 현재 BoonDrawSVG 객체
   */
  init(key, svgString, targetId) {
    const newDocument = this.createDocument(svgString);
    const originalTextElement = this.getBrandNameTextElement(newDocument, targetId);
    this.documentMap.set(key, newDocument);
    this.originalTextElementMap.set(key, originalTextElement);
    return this;
  }
  /**
   * initUniqueId 메서드는 주어진 키와 SVG 문자열, 대상 요소의 ID를 사용하여 BoonDrawSVG 객체를 고유하게 초기화합니다.
   *
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @param {string} svgString - SVG 형식의 문자열 데이터
   * @param {string} targetId - 초기화할 텍스트 요소의 대상 ID
   * @returns {BoonDrawSVG} - 이 메서드를 호출한 현재 BoonDrawSVG 객체
   */
  initUniqueId(key, svgString, targetId) {
    const newSvgString = this.replaceUniqueId(key, svgString);
    const newDocument = this.createDocument(newSvgString);
    const originalTextElement = this.getBrandNameTextElement(this.createDocument(newSvgString), targetId);
    this.documentMap.set(key, newDocument);
    this.originalTextElementMap.set(key, originalTextElement);
    return this;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoonDrawSVG
});
