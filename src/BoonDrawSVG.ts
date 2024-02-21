import TextToSVG from 'text-to-svg';
import { v4 } from 'uuid';
import { DOMParser, XMLSerializer } from 'xmldom';

import {
  GetAdjustedFontSizeProps,
  GetElementByIdOptions,
  GetTextToSVGOptionsProps,
  GetUpdatedBrandNameYProps,
  UpdateBrandNameProps
} from './BoonDrawSVG.types';
import {
  extractContentFromURL,
  getCanvasSize,
  getFontInfoFromFontFace,
  getFontScaleFromFontSize,
  getFontStyles,
  getTextYPosition,
  loadTextToSvg
} from './utils';

export class BoonDrawSVG {
  private svgString: string | null = null;
  private document: Document | null = null;
  private serializer: XMLSerializer = new XMLSerializer();
  private fontMap: Map<string, TextToSVG> = new Map();

  private getNewDocument(svgString: string): Document {
    const parser = new DOMParser();
    const document = parser.parseFromString(svgString, 'image/svg+xml');

    return document;
  }

  private getElementById(
    document: Document,
    targetId: string,
    options?: GetElementByIdOptions
  ): Element | undefined {
    // 모든 요소를 가져온 다음 id가 targetId 인 요소를 직접 비교합니다.
    const allElements = document.getElementsByTagName(options?.qualifiedName ?? '*');
    const element = Array.from(allElements).find((element) => element.getAttribute('id') === targetId);

    return element;
  }

  private getElementByDataId(
    document: Document,
    targetId: string,
    options?: GetElementByIdOptions
  ): Element | undefined {
    // 모든 요소를 가져온 다음 data-id가 targetId 인 요소를 직접 비교합니다.
    const textElements = document.getElementsByTagName(options?.qualifiedName ?? '*');
    const textElement = Array.from(textElements).find((element) => element.getAttribute('data-id') === targetId);

    return textElement;
  }

  private removeAllChildren(element: Node): void {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  private getOriginalTextElement(targetId: string): SVGTextElement | undefined {
    const serializedSvg = this.serializer.serializeToString(this.getDocument());
    const newDocument = this.getNewDocument(serializedSvg);

    return this.getElementByDataId(newDocument, targetId, { qualifiedName: 'text' }) as SVGTextElement;
  }

  private getFontOptions({
    fontSize,
    letterSpacing,
    scale,
  }: GetTextToSVGOptionsProps): TextToSVG.GenerationOptions {
    return {
      x: 0,
      y: 0,
      fontSize: fontSize,
      anchor: 'center top',
      kerning: true,
      letterSpacing: (1 / fontSize) * (letterSpacing * scale),
    };
  }

  private async getTextToSvg(
    document: Document,
    fontFamily: string
  ): Promise<TextToSVG | undefined> {
    if (this.fontMap.has(fontFamily)) {
      return this.fontMap.get(fontFamily) as TextToSVG;
    }

    const fontInfo = getFontInfoFromFontFace(document, fontFamily);

    if (fontInfo === undefined) throw new Error('@font-face를 찾을 수 없습니다.');

    const fontURL = extractContentFromURL(fontInfo.src);

    if (fontURL === null) throw new Error('font url을 찾을 수 없습니다.');

    const textToSvg = await loadTextToSvg(fontURL);

    if (textToSvg === null) throw new Error('폰트를 불러오지 못했습니다.');

    return textToSvg;
  }

  private async getMetrics(
    document: Document,
    text: string,
    fontFamily: string,
    fontSize: number,
    letterSpacing: number
  ): Promise<TextToSVG.Metrics | undefined> {
    const textToSvg = await this.getTextToSvg(document, fontFamily);

    if (!textToSvg) throw new Error('Text To Svg를 구할 수 없습니다.');

    const scale = getFontScaleFromFontSize(fontSize);
    const options = this.getFontOptions({ fontSize, letterSpacing, scale });
    const metrics = textToSvg.getMetrics(text, options);

    this.fontMap.set(fontFamily, textToSvg);

    return metrics;
  }

  private getUpdatedBrandNameDy(targetId: string): number | undefined {
    const originalTextElement = this.getOriginalTextElement(targetId);
    const lastChildDy = (originalTextElement?.lastChild as SVGTSpanElement).getAttribute('dy');

    if (originalTextElement === undefined) return undefined;
    if (lastChildDy === null) return undefined;

    const childrenCount = originalTextElement.childNodes.length;

    const dy = (+lastChildDy * (childrenCount - 1)) / childrenCount;

    return dy;
  }

  private async getUpdatedBrandNameY({
    document,
    targetId,
    brandName,
    fontSize,
  }: GetUpdatedBrandNameYProps): Promise<number | undefined> {
    const canvasSize = getCanvasSize(document);

    if (canvasSize === undefined) return;

    const originalTextElement = this.getOriginalTextElement(targetId);
    const textElement = this.getElementByDataId(document, targetId, { qualifiedName: 'text' }) as SVGTextElement;

    if (originalTextElement === undefined) return;
    if (textElement === undefined) return;

    const originalTextYPosition = getTextYPosition(originalTextElement);
    const originalFontStyles = getFontStyles(originalTextElement);
    const fontStyles = getFontStyles(textElement);

    if (originalTextYPosition === undefined) return;
    if (originalFontStyles === undefined) return;
    if (fontStyles === undefined) return;

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

    if (metrics === undefined) return;
    if (metricsForCenter === undefined) return;
    if (originalY === undefined) return;

    const centerY =
      (originalY + metricsForCenter.height / 2) / canvasSize.canvasHeight;
    const newY = canvasSize.canvasHeight * centerY - metrics.height / 2;

    return newY;
  }

  private async getAdjustedFontSize({
    document,
    targetId,
    brandName,
  }: GetAdjustedFontSizeProps): Promise<number | undefined> {
    const textElement = this.getElementByDataId(document, targetId, { qualifiedName: 'text' }) as SVGTextElement;
    const originalTextElement = this.getOriginalTextElement(targetId);

    if (textElement === undefined || originalTextElement === undefined) {
      throw new Error(`data-id가 ${targetId}인 TextElement를 찾을 수 없습니다.`);
    }

    const fontStyles = getFontStyles(textElement);
    const { fontFamily, fontSize, letterSpacing } = fontStyles;
    const scale = getFontScaleFromFontSize(fontSize);
    const textToSvg = await this.getTextToSvg(document, fontFamily);

    if (textToSvg === undefined) throw new Error('폰트를 불러올 수 없습니다.');

    const options = this.getFontOptions({ fontSize, letterSpacing, scale });
    const biggestWidth = Math.max(
      ...Array
        .from(originalTextElement.childNodes)
        .map((childNode) => textToSvg.getMetrics(childNode.textContent ?? brandName, options).width)
    );
    const { width: currentWidth } = textToSvg.getMetrics(brandName, options);

    if (biggestWidth < currentWidth) return fontSize * (biggestWidth / currentWidth);
    return fontSize;
  }

  async updateBrandName({
    targetId,
    brandName,
  }: UpdateBrandNameProps): Promise<BoonDrawSVG> {
    const document = this.getDocument();
    const textElement = this.getElementByDataId(document, targetId, { qualifiedName: 'text' }) as SVGTextElement;
    const firstChild = textElement?.firstChild as SVGTSpanElement | null;

    if (textElement === undefined) throw new Error('텍스트 엘리먼트를 찾을 수 없습니다.');
    if (firstChild === null) throw new Error('텍스트 엘리먼트의 첫번째 노드를 찾을 수 없습니다.');

    const cloneNode = firstChild.cloneNode() as SVGTSpanElement;
    const fontSize = await this.getAdjustedFontSize({
      document,
      targetId,
      brandName,
    });

    if (fontSize === undefined) return this;

    const updatedY = await this.getUpdatedBrandNameY({
      document,
      targetId,
      brandName,
      fontSize,
    });
    const updatedDy = this.getUpdatedBrandNameDy(targetId);

    if (updatedY === undefined || updatedDy === undefined) return this;

    cloneNode.textContent = brandName;
    cloneNode.setAttribute('dy', `${updatedDy}`);
    cloneNode.setAttribute('font-size', `${fontSize}`);
    textElement.setAttribute('y', `${updatedY}`);
    this.removeAllChildren(textElement);
    textElement.appendChild(cloneNode);

    return this;
  }

  /**
   * setFullWidth 함수는 SVG 문서 요소의 너비와 높이를 100%로 설정합니다.
   * @returns {BoonDrawSVG} 현재 객체(this)를 반환합니다.
   */
  setFullWidth(): BoonDrawSVG {
    // 현재 객체의 문서 요소를 가져옵니다.
    const documentElement = this.getDocument().documentElement;

    // 문서 요소의 너비와 높이를 100%로 설정합니다.
    documentElement.setAttribute('width', '100%');
    documentElement.setAttribute('height', '100%');

    // 현재 객체를 반환합니다.
    return this;
  }

  /**
   * getDocument 함수는 현재 객체(this)의 문서(document)를 반환합니다.
   * @throws {Error} 만약 문서(document)가 초기화되지 않았을 경우 에러를 던집니다.
   * @returns {Document} 현재 객체(this)의 문서(document)를 반환합니다.
   */
  getDocument(): Document {
    // 만약 문서(document)가 초기화되지 않았다면 에러를 던집니다.
    if (!this.document) throw new Error('Document is not initialized');

    // 현재 객체의 문서(document)를 반환합니다.
    return this.document;
  }

  /**
   * getSvgString 함수는 현재 객체(this)의 SVG 문자열(svgString)을 반환합니다.
   * @throws {Error} 만약 SVG 문자열(svgString)이 초기화되지 않았을 경우 에러를 던집니다.
   * @returns {string} 현재 객체(this)의 SVG 문자열(svgString)을 반환합니다.
   */
  getSvgString(): string {
    const serializedSvg = this.serializer.serializeToString(this.getDocument());

    return serializedSvg;
  }

  /**
   * SVG 문자열을 이용하여 새로운 문서를 생성하고 고유한 아이디로 초기화합니다.
   * @param svgString SVG 문자열
   * @returns 생성된 문서와 초기화된 고유 아이디를 포함한 객체
   */
  initWithUniqueId(svgString: string) {
    // document 생성
    const document = this.getNewDocument(svgString);

    // 모든 요소 검색
    const allElements = document.getElementsByTagName('*');

    // 모든 요소를 가져와서 id를 가진 요소만 필터링
    const ids = Array.from(allElements).filter((element) => element.getAttribute('id')).map((element) => element.getAttribute('id')) as string[];

    // 유니크한 키 생성
    const uniqueKey = v4();
    let newSvgString = svgString;

    // 아이디를 고유 키와 함께 변경하여 새로운 SVG 문자열 생성
    ids.forEach((id, index) => {
      newSvgString = newSvgString.replace(new RegExp(id, 'gi'), `${uniqueKey}-${index}`);
    });

    // SVG 문자열 및 문서 업데이트
    this.svgString = newSvgString;
    this.document = this.getNewDocument(newSvgString);

    return this;
  }

  /**
   * SVG 문자열을 이용하여 초기화합니다.
   * @param svgString SVG 문자열
   * @returns 초기화된 객체
   */
  init(svgString: string) {
    // SVG 문자열 및 문서 업데이트
    this.svgString = svgString;
    this.document = this.getNewDocument(svgString);

    return this;
  }
}
