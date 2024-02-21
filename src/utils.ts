import { Declaration, FontFace, Stylesheet } from 'css';
import TextToSVG from 'text-to-svg';

import {
  DEFAULT_FONT_SIZE,
  PROPERTY_FONT_FAMILY,
  PROPERTY_FONT_SRC,
  RULE_FONT_FACE
} from './constants';
import {
  CanvasSize,
  FONT_FACE_PROPERTIES,
  FontInfo,
  Position
} from './utils.types';

const cssParse = require('css/lib/parse');

/**
 * 주어진 @font-face 문자열에서 폰트 정보를 추출하는 함수
 * @param fontFaceString - @font-face 스타일 문자열
 * @returns 폰트 정보의 배열 또는 null
 */
const extractFontInfos = (fontFaceString: string) => {
  // CSS 파싱하여 @font-face 규칙 추출
  const result = cssParse(fontFaceString) as Stylesheet;
  const fontFaces = result.stylesheet?.rules.filter(
    (rule) => rule.type === RULE_FONT_FACE && (rule as FontFace).declarations
  ) as FontFace[];

  if (!fontFaces) return null;

  // 폰트 정보 추출
  const fontInfos = fontFaces.map((fontFace) => {
    return (fontFace.declarations as Declaration[])
      .map((declaration) => {
        const { property, value } = declaration;

        // font-family와 src 속성만 추출
        if (
          property &&
          value &&
          [PROPERTY_FONT_FAMILY, PROPERTY_FONT_SRC].includes(property)
        ) {
          return { property, value };
        }
      })
      .filter((v) => !!v) as FontInfo[];
  });

  return fontInfos;
};

export const extractContentFromURL = (urlString: string) => {
  const urlRegex = /url\((['"])?(.*?)\1\)/;
  const match = urlString.match(urlRegex);

  return match ? match[2] : null;
};

/**
 * @param document - 현재 문서 객체
 * @returns @font-face 스타일에서 추출한 URL의 배열 또는 null
 */
export const getFontInfoFromFontFace = (
  document: Document,
  fontFamily: string
): Record<FONT_FACE_PROPERTIES, string> | undefined => {
  // style 태그에서 @font-face 스타일 가져오기
  const styleTags = document.getElementsByTagName('style');
  const styleTag = styleTags.item(0);
  const fontFaceString = styleTag?.textContent;

  if (!fontFaceString) return;

  // @font-face 스타일에서 폰트 정보 추출
  const fontInfos = extractFontInfos(fontFaceString);

  // 폰트 정보에서 src 속성 값만 추출하여 URL 배열 생성
  const fontInfo = fontInfos?.find((fontInfo) =>
    fontInfo.find((font) => font.property === PROPERTY_FONT_FAMILY && font.value === fontFamily)
  );

  if (!fontInfo) return;

  const result = fontInfo.reduce((prev, next) => {
    prev[next.property as FONT_FACE_PROPERTIES] = next.value;
    return prev;
  }, {} as Record<FONT_FACE_PROPERTIES, string>);

  return result;
};

export const loadTextToSvg = (fontURL: string): Promise<TextToSVG> => {
  return new Promise<TextToSVG>((resolve, reject) => {
    return TextToSVG.load(fontURL, (error, textToSvg) => {
      if (error || !textToSvg) {
        return reject(error);
      }

      return resolve(textToSvg);
    });
  });
};

export const getFontScaleFromFontSize = (fontSize: number) =>
  fontSize / DEFAULT_FONT_SIZE;

export const getCanvasSize = (document: Document): CanvasSize | undefined => {
  const svgElement = document.documentElement;
  const viewBox = svgElement.getAttribute('viewBox');

  if (!viewBox) return;

  const [, , canvasWidthString, canvasHeightString] = viewBox.split(' ');
  const [canvasWidth, canvasHeight] = [+canvasWidthString, +canvasHeightString];

  return { canvasWidth, canvasHeight };
};

export const getTextXPosition = (
  textElement: SVGTextElement
): Position['x'] | undefined => {
  const xString = textElement.getAttribute('x');

  if (xString === null) return;

  return +xString;
};

export const getTextYPosition = (
  textElement: SVGTextElement
): Position['y'] | undefined => {
  const yString = textElement.getAttribute('y');

  if (yString === null) return;

  return +yString;
};

export const getTextPosition = (
  textElement: SVGTextElement
): Position | undefined => {
  const x = getTextXPosition(textElement);
  const y = getTextYPosition(textElement);

  if (x === undefined || y === undefined) return undefined;

  return { x, y };
};

export const getFontStyles = (textElement: SVGTextElement) => {
  const fontFamily = textElement.getAttribute('font-family');
  const fontSizeString = textElement.getAttribute('font-size');
  const letterSpacingString = textElement.getAttribute('letter-spacing');

  if (!fontFamily) throw new Error(`font-family를 찾을 수 없습니다. ${textElement}`);
  if (!fontSizeString) throw new Error(`font-size를 찾을 수 없습니다. ${textElement}`);
  if (!letterSpacingString) throw new Error(`letter-spacing을 찾을 수 없습니다. ${textElement}`);

  const fontSize = +fontSizeString;
  const letterSpacing = +letterSpacingString;

  return { fontFamily, fontSize, letterSpacing };
};
