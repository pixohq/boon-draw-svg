import TextToSVG from "text-to-svg";
import { DOMParser, XMLSerializer } from "xmldom";

import { UpdateBrandNameProps } from "./BoonDrawSVG.types";

const getOptions = (
  fontSize: number,
  letterSpacing: number,
  scale: number
): TextToSVG.GenerationOptions => {
  return {
    x: 0,
    y: 0,
    fontSize: fontSize,
    anchor: "center top",
    kerning: true,
    letterSpacing: (1 / fontSize) * (letterSpacing * scale),
  };
};

export class BoonDrawSVG {
  private svgString: string;
  private svgDocument: Document;
  private serializer: XMLSerializer = new XMLSerializer();

  constructor(svgString: string) {
    this.svgString = svgString;
    this.svgDocument = this.getSvgDocument();
  }

  private getElementById(
    doc: Document,
    targetId: string,
    options: { tagName?: string }
  ) {
    // 모든 요소를 가져온 다음 id가 {template.brandNameId} 인 요소를 직접 비교합니다.
    const allElements = doc.getElementsByTagName(options.tagName ?? "*");
    for (let i = 0; i < allElements.length; i++) {
      if (allElements[i].getAttribute("id") === targetId) {
        return allElements[i];
      }
    }
    return null;
  }

  private getNewSvgDocument(svgString: string): Document {
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(svgString, "image/svg+xml");

    return svgDocument;
  }

  private removeAllChildren(element: Node): void {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  setSvgString(svgString: string) {
    this.svgString = svgString;
    this.svgDocument = this.getSvgDocument();
  }

  getSvgDocument(): Document {
    if (this.svgDocument) {
      return this.svgDocument;
    }

    return this.getNewSvgDocument(this.svgString);
  }

  getSvgString(): string {
    const serializedSvg = this.serializer.serializeToString(
      this.getSvgDocument()
    );

    return serializedSvg;
  }

  async updateBrandName({
    brandNameId,
    brandName,
  }: UpdateBrandNameProps): Promise<BoonDrawSVG> {
    const svgDocument = this.getSvgDocument();
    const svgElement = svgDocument.documentElement;

    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");

    const xmlns = svgElement.getAttribute("xmlns");
    const viewBox = svgElement.getAttribute("viewBox");

    const textElement = this.getElementById(svgDocument, brandNameId, {
      tagName: "text",
    });
    const firstChild = textElement?.firstChild as SVGTSpanElement | null;

    if (!xmlns || !viewBox || !textElement || !firstChild) return this;

    // TODO: dy 구하기

    const getOriginalTextElement = () => {
      const svgDocument = this.getNewSvgDocument(this.svgString);
      const textElement = this.getElementById(svgDocument, brandNameId, {
        tagName: "text",
      });

      return textElement;
    };

    const getFontURLsFromFontFace = (document: Document) => {
      // style 태그에서 @font-face 스타일 가져오기
      const styleTags = document.getElementsByTagName("style");
      const styleTag = styleTags.item(0);
      if (!styleTag) return;
      const fontStyles = styleTag?.textContent;
      if (!fontStyles) return;
      // @font-face 문자열 파싱
      const fontFaceRules = fontStyles.match(/@font-face\s*{[^}]*}/g);
      if (!fontFaceRules) return;
      // 주어진 문자열에서 src 속성의 URL 추출하는 정규 표현식
      const srcRegex = /src:\s*url\(['"]([^'"]+)['"]\)/g;
      // 각 @font-face 스타일 정보 출력
      return fontFaceRules.map((fontFaceRule) => {
        const regexp = srcRegex.exec(fontFaceRule);
        const fontBase64 = regexp?.at(1);
        if (regexp && fontBase64) return fontBase64;
      });
    };

    const getAdjustedFontSize = async () => {
      return new Promise<number | null>((resolve, reject) => {
        const fontURLs = getFontURLsFromFontFace(svgDocument);
        const fontURL = fontURLs?.at(0);

        if (!fontURL) return resolve(null);

        const fontFamily = textElement.getAttribute("font-family");
        const fontSizeString = textElement.getAttribute("font-size");
        const letterSpacingString = textElement.getAttribute("letter-spacing");

        if (!fontFamily || !fontSizeString || !letterSpacingString)
          return resolve(null);

        TextToSVG.load(fontURL, (error, textToSvg) => {
          if (error || !textToSvg) return reject(error);

          const fontSize = +fontSizeString;
          const letterSpacing = +letterSpacingString;
          const scale = fontSize / 50;
          const originalTextElement = getOriginalTextElement();

          if (!originalTextElement) return resolve(fontSize);

          const options = getOptions(fontSize, letterSpacing, scale);
          const biggestWidth = Math.max(
            ...Array.from(originalTextElement.childNodes).map(
              (childNode) =>
                textToSvg.getMetrics(
                  childNode.textContent ?? brandName,
                  options
                ).width
            )
          );
          const metrics = textToSvg.getMetrics(brandName, options);
          const { width: currentWidth } = metrics;
          if (biggestWidth < currentWidth) {
            resolve(fontSize * (biggestWidth / currentWidth));
          }
          resolve(fontSize);
        });
      });
    };

    const getDy = () => {
      const textElement = getOriginalTextElement();
      if (!textElement) return null;
      const lastChild = textElement.lastChild as SVGTSpanElement;
      const lastChildDy = lastChild.getAttribute("dy");
      if (!lastChildDy) return null;
      const dy =
        (parseFloat(lastChildDy) * (textElement.childNodes.length - 1)) /
        textElement.childNodes.length;

      return dy;
    };

    // TODO: 폰트 크기 조정 후 다시 dy 구하기
    const dy = getDy();

    const cloneNode = firstChild.cloneNode() as SVGTSpanElement;
    const newFontSize = await getAdjustedFontSize();
    console.log("newFontSize", newFontSize);

    cloneNode.textContent = brandName;
    cloneNode.setAttribute("xmlns", xmlns);
    cloneNode.setAttribute("dy", `${dy}`);
    newFontSize && cloneNode.setAttribute("font-size", `${newFontSize}`);
    this.removeAllChildren(textElement);
    textElement.appendChild(cloneNode);

    return this;
  }
}
