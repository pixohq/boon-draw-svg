import TextToSVG from 'text-to-svg';
import { DOMParser, XMLSerializer } from 'xmldom';

import {
  GetAdjustedFontSizeProps,
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
import { BoonDrawSVGOptions } from './utils.types';

export class BoonDrawSVG {
  private svgString: string;
  private document: Document;
  private serializer: XMLSerializer = new XMLSerializer();
  private fontMap: Map<string, TextToSVG> = new Map();

  constructor(svgString: string, options?: BoonDrawSVGOptions) {
    this.svgString = svgString;
    this.document = this.getDocument();

    if (options?.fullWidth) {
      this.setFullWidth();
    }
  }

  private setFullWidth() {
    const documentElement = this.document.documentElement;

    documentElement.setAttribute('width', '100%');
    documentElement.setAttribute('height', '100%');
  }

  private getNewDocument(svgString: string): Document {
    const parser = new DOMParser();
    const document = parser.parseFromString(svgString, 'image/svg+xml');

    return document;
  }

  private getElementById(
    doc: Document,
    targetId: string,
    options: { tagName?: string }
  ) {
    // 모든 요소를 가져온 다음 id가 {template.brandNameId} 인 요소를 직접 비교합니다.
    const allElements = doc.getElementsByTagName(options.tagName ?? '*');
    for (let i = 0; i < allElements.length; i++) {
      if (allElements[i].getAttribute('id') === targetId) {
        return allElements[i];
      }
    }
    return null;
  }

  private getTextElement(
    document: Document,
    targetId: string
  ): SVGTextElement | null {
    const textElement = this.getElementById(document, targetId, {
      tagName: 'text',
    }) as SVGTextElement;

    return textElement;
  }

  private removeAllChildren(element: Node): void {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  private getOptions({
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

    if (fontInfo === undefined) return;

    const fontURL = extractContentFromURL(fontInfo.src);

    if (!fontURL) return;

    return loadTextToSvg(fontURL);
  }

  private async getMetrics(
    document: Document,
    text: string,
    fontFamily: string,
    fontSize: number,
    letterSpacing: number
  ): Promise<TextToSVG.Metrics | undefined> {
    const textToSvg = await this.getTextToSvg(document, fontFamily);

    if (!textToSvg) return;

    const scale = getFontScaleFromFontSize(fontSize);
    const options = this.getOptions({ fontSize, letterSpacing, scale });
    const metrics = textToSvg.getMetrics(text, options);

    this.fontMap.set(fontFamily, textToSvg);

    return metrics;
  }

  private getOriginalTextElement(targetId: string): SVGTextElement | null {
    const newDocument = this.getNewDocument(this.svgString);

    return this.getTextElement(newDocument, targetId);
  }

  private getUpdatedBrandNameDy(brandNameId: string): number | undefined {
    const originalTextElement = this.getOriginalTextElement(brandNameId);
    const lastChildDy = (
      originalTextElement?.lastChild as SVGTSpanElement
    ).getAttribute('dy');

    if (originalTextElement === null) return undefined;
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
    const textElement = this.getTextElement(document, targetId);

    if (originalTextElement === null) return;
    if (textElement === null) return;

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

  private async getAdjustedFontStyles({
    document,
    targetId,
    brandName,
  }: GetAdjustedFontSizeProps): Promise<{ fontSize: number; letterSpacing: number; } | undefined> {
    const textElement = this.getTextElement(document, targetId);
    const originalTextElement = this.getOriginalTextElement(targetId);

    if (textElement === null || originalTextElement === null) return;

    const fontStyles = getFontStyles(textElement);

    if (fontStyles === undefined) return;

    const { fontFamily, fontSize, letterSpacing } = fontStyles;
    const scale = getFontScaleFromFontSize(fontSize);
    const textToSvg = await this.getTextToSvg(document, fontFamily);

    if (textToSvg === undefined) return;

    const options = this.getOptions({ fontSize, letterSpacing, scale });
    const biggestWidth = Math.max(
      ...Array.from(originalTextElement.childNodes).map(
        (childNode) =>
          textToSvg.getMetrics(childNode.textContent ?? brandName, options)
            .width
      )
    );
    const { width: currentWidth } = textToSvg.getMetrics(brandName, options);

    if (biggestWidth < currentWidth) {
      const changedScale = (biggestWidth / currentWidth);

      return { fontSize: fontSize * changedScale, letterSpacing: letterSpacing * changedScale };
    }
    return { fontSize: fontSize, letterSpacing: letterSpacing };
  }

  async updateBrandName({
    brandNameId,
    brandName,
  }: UpdateBrandNameProps): Promise<BoonDrawSVG> {
    try {
      const document = this.getDocument();
      const textElement = this.getTextElement(document, brandNameId);
      const firstChild = textElement?.firstChild as SVGTSpanElement | null;

      if (!textElement || !firstChild) return this;

      const cloneNode = firstChild.cloneNode() as SVGTSpanElement;
      const adjustedFontStyles = await this.getAdjustedFontStyles({
        document: document,
        targetId: brandNameId,
        brandName,
      });


      if (adjustedFontStyles === undefined) return this;

      const { fontSize, letterSpacing } = adjustedFontStyles;
      const updatedY = await this.getUpdatedBrandNameY({
        document: document,
        targetId: brandNameId,
        brandName,
        fontSize,
      });
      const updatedDy = this.getUpdatedBrandNameDy(brandNameId);

      if (updatedY === undefined || updatedDy === undefined) return this;

      cloneNode.textContent = brandName;
      cloneNode.setAttribute('dy', `${updatedDy}`);
      cloneNode.setAttribute('font-size', `${fontSize}`);
      cloneNode.setAttribute('letter-spacing', `${letterSpacing}`);
      textElement.setAttribute('y', `${updatedY}`);
      this.removeAllChildren(textElement);
      textElement.appendChild(cloneNode);

      return this;
    } catch (error) {
      return this;
    }
  }

  getDocument(): Document {
    if (this.document) {
      return this.document;
    }

    return this.getNewDocument(this.svgString);
  }

  getSvgString(): string {
    const serializedSvg = this.serializer.serializeToString(this.getDocument());

    return serializedSvg;
  }
}
