import TextToSVG from 'text-to-svg';
import { v4 } from 'uuid';
import { DOMParser, XMLSerializer } from 'xmldom';

import {
  GetAdjustedFontSizeProps,
  GetAdjustedFontSizeResult,
  GetElementByIdOptions,
  GetUpdatedBrandNameDyProps,
  GetUpdatedBrandNameYProps,
  UpdateBrandNameProps
} from './BoonDrawSVG.types';
import {
  extractContentFromURL,
  getCanvasSize,
  getFontInfoFromFontFace,
  getFontScaleFromFontSize,
  getFontStyleOption,
  getFontStyles,
  getTextYPosition,
  loadTextToSvg
} from './utils/utils';

export class BoonDrawSVG {
  private svgStringMap: Map<string, string> = new Map();
  private documentMap: Map<string, Document> = new Map();
  private serializer: XMLSerializer = new XMLSerializer();
  private textToSvgMap: Map<string, TextToSVG> = new Map();

  /**
   * 주어진 document에서 주어진 targetId와 일치하는 요소를 반환합니다.
   *
   * @param document Document - 요소를 검색할 Document 객체
   * @param targetId string - 검색할 요소의 ID
   * @param options GetElementByIdOptions - getElementByIdOptions에 대한 선택적 옵션
   * @returns Element | null - 주어진 ID와 일치하는 요소 또는 null (찾지 못한 경우)
   */
  private getElementById(document: Document, targetId: string, options: GetElementByIdOptions) {
    // 모든 요소를 가져온 다음 id가 targetId 인 요소를 직접 비교합니다.
    const element = Array.from(document.getElementsByTagName(options.qualifiedName ?? '*')).find((element) => element.getAttribute('id') === targetId);

    if (element) {
      return element;
    }

    return null;
  }

  /**
   * 주어진 document에서 주어진 targetId와 일치하는 SVGTextElement를 반환합니다.
   *
   * @param document Document - 요소를 검색할 Document 객체
   * @param targetId string - 검색할 요소의 data-id
   * @returns SVGTextElement | null - 주어진 data-id와 일치하는 요소 또는 null (찾지 못한 경우)
   */
  private getBrandNameTextElement(document: Document, targetId: string): SVGTextElement | null {
    // 모든 요소를 가져온 다음 data-id가 targetId 인 요소를 직접 비교합니다.
    const textElement = Array.from(document.getElementsByTagName('text')).find((element) => element.getAttribute('data-id') === targetId);

    return textElement ?? null;
  }

  /**
   * 주어진 요소의 모든 자식을 제거합니다.
   *
   * @param element Element - 자식을 제거할 요소
   */
  private removeAllChildren(element: Element): void {
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
  private getNewDocument(svgString: string): Document {
    const parser = new DOMParser();
    const document = parser.parseFromString(svgString, 'image/svg+xml');

    return document;
  }

  /**
   * 주어진 키와 대상 ID를 사용하여 원본 SVG 텍스트 요소를 가져옵니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param targetId - 가져올 텍스트 요소의 대상 ID
   * @returns 대상 ID에 해당하는 SVG 텍스트 요소 또는 null (찾지 못한 경우)
   */
  private getOriginalTextElement(key: string, targetId: string): SVGTextElement | null {
    // 새로운 문서를 생성하여 SVG 문자열을 이용하여 가져옵니다.
    const newDocument = this.getNewDocument(this.getSvgString(key));

    // 새 문서에서 대상 ID에 해당하는 브랜드 이름 텍스트 요소를 가져옵니다.
    return this.getBrandNameTextElement(newDocument, targetId);
  }

  /**
   * getTextToSvg 함수는 주어진 Document와 폰트 패밀리에 대한 TextToSVG 인스턴스를 비동기적으로 가져옵니다.
   *
   * @param document - Document 객체
   * @param fontFamily - 폰트 패밀리
   * @returns Promise<TextToSVG | undefined> - TextToSVG 인스턴스 또는 undefined (실패 시)
   */
  private async getTextToSvg(
    document: Document,
    fontFamily: string
  ): Promise<TextToSVG | undefined> {
    if (this.textToSvgMap.has(fontFamily)) {
      return this.textToSvgMap.get(fontFamily) as TextToSVG;
    }

    const fontInfo = getFontInfoFromFontFace(document, fontFamily);

    if (fontInfo === undefined) throw new Error('@font-face를 찾을 수 없습니다.');

    const fontURL = extractContentFromURL(fontInfo.src);

    if (fontURL === null) throw new Error('font url을 찾을 수 없습니다.');

    const textToSvg = await loadTextToSvg(fontURL);

    if (textToSvg === null) throw new Error('폰트를 불러오지 못했습니다.');

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
  private getUpdatedBrandNameDy({
    key,
    targetId,
  }: GetUpdatedBrandNameDyProps): number | undefined {
    const originalTextElement = this.getOriginalTextElement(key, targetId);
    const lastChildDy = (originalTextElement?.lastChild as SVGTSpanElement).getAttribute('dy');

    if (originalTextElement === null) return undefined;
    if (lastChildDy === null) return undefined;

    const childrenCount = originalTextElement.childNodes.length;

    const dy = (+lastChildDy * (childrenCount - 1)) / childrenCount;

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
  private async getUpdatedBrandNameY({
    key,
    document,
    targetId,
    brandName,
    fontSize,
  }: GetUpdatedBrandNameYProps): Promise<number | undefined> {
    const canvasSize = getCanvasSize(document);

    if (canvasSize === undefined) return;

    const originalTextElement = this.getOriginalTextElement(key, targetId);
    const textElement = this.getBrandNameTextElement(document, targetId);

    if (!originalTextElement) return;
    if (!textElement) return;

    const originalTextYPosition = getTextYPosition(originalTextElement);
    const originalFontStyles = getFontStyles(originalTextElement);
    const fontStyles = getFontStyles(textElement);

    if (!originalTextYPosition) return;
    if (!originalFontStyles) return;
    if (!fontStyles) return;

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

  /**
   * getAdjustedFontStyles 함수는 주어진 프로퍼티를 사용하여 조정된 폰트 스타일을 비동기적으로 가져옵니다.
   *
   * @param key - SVG를 저장한 맵에서의 키
   * @param document - Document 객체
   * @param targetId - 대상 요소의 ID
   * @param brandName - 브랜드 이름
   * @returns Promise<GetAdjustedFontSizeResult | undefined> - 조정된 폰트 크기 및 글자 간격 객체 또는 undefined (실패 시)
   */
  private async getAdjustedFontStyles({
    key,
    document,
    targetId,
    brandName,
  }: GetAdjustedFontSizeProps): Promise<GetAdjustedFontSizeResult | undefined> {
    const textElement = this.getBrandNameTextElement(document, targetId);
    const originalTextElement = this.getOriginalTextElement(key, targetId);

    if (!textElement || !originalTextElement) throw new Error(`data-id가 ${targetId}인 element를 찾을 수 없습니다.`);

    const fontStyles = getFontStyles(textElement);
    const { fontFamily, fontSize, letterSpacing } = fontStyles;
    const scale = getFontScaleFromFontSize(fontSize);
    const textToSvg = await this.getTextToSvg(document, fontFamily);

    if (textToSvg === undefined) throw new Error('폰트를 불러올 수 없습니다.');

    const options = getFontStyleOption({ fontSize, letterSpacing, scale });
    const biggestWidth = Math.max(
      ...Array
        .from(originalTextElement.childNodes)
        .map((childNode) => textToSvg.getMetrics(childNode.textContent ?? brandName, options).width)
    );
    const { width: currentWidth } = textToSvg.getMetrics(brandName, options);

    if (biggestWidth < currentWidth) {
      const changedScale = (biggestWidth / currentWidth);

      return { fontSize: fontSize * changedScale, letterSpacing: letterSpacing * changedScale };
    }
    return { fontSize: fontSize, letterSpacing: letterSpacing };
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
    brandName,
  }: UpdateBrandNameProps): Promise<BoonDrawSVG> {
    try {
      const document = this.getDocument(key);
      const textElement = this.getBrandNameTextElement(document, targetId);
      const firstChild = textElement?.firstChild as SVGTSpanElement | null;

      if (!textElement) throw new Error('텍스트 엘리먼트를 찾을 수 없습니다.');
      if (!firstChild) throw new Error('텍스트 엘리먼트의 첫번째 노드를 찾을 수 없습니다.');

      const cloneNode = firstChild.cloneNode() as SVGTSpanElement;
      const adjustedFontStyles = await this.getAdjustedFontStyles({
        key,
        document,
        targetId,
        brandName,
      });

      if (adjustedFontStyles === undefined) return this;

      const { fontSize, letterSpacing } = adjustedFontStyles;
      const updatedY = await this.getUpdatedBrandNameY({
        key,
        document,
        targetId,
        brandName,
        fontSize,
      });
      const updatedDy = this.getUpdatedBrandNameDy({
        key,
        targetId,
      });

      if (updatedY === undefined || updatedDy === undefined) return this;

      cloneNode.textContent = brandName;
      cloneNode.setAttribute('dy', `${updatedDy}`);
      cloneNode.setAttribute('font-size', `${fontSize}`);
      cloneNode.setAttribute('letter-spacing', `${letterSpacing}`);
      textElement.setAttribute('y', `${updatedY}`);
      this.removeAllChildren(textElement);
      textElement.appendChild(cloneNode);

      return this;
    } catch {
      return this;
    }
  }

  /**
   * getDocument 함수는 현재 객체(this)의 문서(document)를 반환합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @throws {Error} 만약 문서(document)가 초기화되지 않았을 경우 에러를 던집니다.
   * @returns {Document} 현재 객체(this)의 문서(document)를 반환합니다.
   */
  getDocument(key: string): Document {
    if (!this.documentMap.has(key)) {
      throw new Error('Document 문서가 초기화되지 않았습니다.');
    }

    return this.documentMap.get(key) as Document;
  }

  /**
   * getSvgString 함수는 현재 객체(this)의 SVG 문자열을 반환합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @throws {Error} 만약 SVG 문자열이 초기화되지 않았을 경우 에러를 던집니다.
   * @returns {string} 현재 객체(this)의 SVG 문자열을 반환합니다.
   */
  getSvgString(key: string): string {
    if (!this.svgStringMap.has(key)) {
      throw new Error('SVG 문서가 초기화되지 않았습니다.');
    }

    return this.svgStringMap.get(key) as string;
  }

  /**
   * getSvgStringFromDocument 함수는 현재 객체(this)의 문서(document)를 문자열 형태의 SVG로 직렬화하여 반환합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {string} 문서(document)를 문자열 형태의 SVG로 직렬화한 결과를 반환합니다.
   */
  getSvgStringFromDocument(key: string): string {
    // 현재 객체(this)의 문서(document)를 문자열 형태의 SVG로 직렬화합니다.
    const serializedSvg = this.serializer.serializeToString(this.getDocument(key));

    // 직렬화된 SVG 문자열을 반환합니다.
    return serializedSvg;
  }

  /**
   * setFullWidth 함수는 SVG 문서 요소의 너비와 높이를 100%로 설정합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {BoonDrawSVG} 현재 객체(this)를 반환합니다.
   */
  setFullWidth(key: string): BoonDrawSVG {
    const documentElement = this.getDocument(key).documentElement;

    // 문서 요소의 너비와 높이를 100%로 설정합니다.
    documentElement.setAttribute('width', '100%');
    documentElement.setAttribute('height', '100%');

    return this;
  }

  /**
   * setUniqueId 함수는 SVG 문자열 내의 모든 요소의 ID를 고유한 값으로 대체합니다.
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @returns {string} 새로운 SVG 문자열
   */
  private replaceUniqueId(key: string, svgString: string): string {
    const uniqueKey = v4(); // v4() 함수는 uuid 모듈에서 유니크한 키를 생성합니다.
    const document = this.getNewDocument(svgString);
    const allElements = document.getElementsByTagName('*');

    // 모든 요소 중 ID를 가진 요소만 필터링하여 배열로 변환합니다.
    const elementsHaveId = Array.from(allElements).filter((element) => element.getAttribute('id'));

    let newSvgString = svgString;

    // 각 요소를 고유한 키와 함께 변경하여 새로운 SVG 문자열 생성
    elementsHaveId.forEach((element, index) => {
      const id = element.getAttribute('id') as string;

      // 현재 ID를 고유한 키와 인덱스로 대체하여 새로운 SVG 문자열을 생성합니다.
      newSvgString = newSvgString.replace(new RegExp(id, 'gi'), `${key}_${uniqueKey}_${index}`);
    });

    return newSvgString;
  }

  /**
   * init 함수는 주어진 키와 SVG 문자열을 사용하여 BoonDrawSVG 객체를 초기화합니다.
   *
   * @param {string} key - SVG를 저장할 맵에서의 키
   * @param {string} svgString - SVG 형식의 문자열 데이터
   * @returns 이 메서드를 호출한 현재 BoonDrawSVG 객체
   */
  init(key: string, svgString: string): BoonDrawSVG {
    // SVG 문자열 및 문서 업데이트
    this.svgStringMap.set(key, svgString);
    this.documentMap.set(key, this.getNewDocument(svgString));

    return this;
  }

  initUniqueId(key: string, svgString: string): BoonDrawSVG {
    const newSvgString = this.replaceUniqueId(key, svgString);

    // SVG 문자열 및 문서 업데이트
    this.svgStringMap.set(key, newSvgString);
    this.documentMap.set(key, this.getNewDocument(newSvgString));

    return this;
  }
}
