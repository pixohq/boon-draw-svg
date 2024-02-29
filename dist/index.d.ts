interface UpdateBrandNameProps {
    key: string;
    targetId: string;
    brandName: string;
}

/**
 * BoonDrawSVG 클래스는 SVG 문자열을 생성, 관리 및 조작하는 데 사용됩니다.
 * 이 클래스는 주어진 키에 대한 SVG 문자열을 저장하고 해당 문자열을 이용하여
 * 문서를 만들어내거나 업데이트합니다. 또한 텍스트 요소의 폰트 스타일을 조절하고,
 * 특정 요소의 위치를 계산하여 업데이트하는 등의 기능을 제공합니다.
 */
declare class BoonDrawSVG {
    private serializer;
    private originalTextElementMap;
    private documentMap;
    private textToSvgMap;
    /**
     * 주어진 document에서 주어진 targetId와 일치하는 요소를 반환합니다.
     *
     * @param document Document - 요소를 검색할 Document 객체
     * @param targetId string - 검색할 요소의 ID
     * @param options GetElementByIdOptions - getElementByIdOptions에 대한 선택적 옵션
     * @returns Element | null - 주어진 ID와 일치하는 요소 또는 null (찾지 못한 경우)
     */
    private getElementById;
    /**
     * 주어진 document에서 주어진 targetId와 일치하는 SVGTextElement를 반환합니다.
     *
     * @param document Document - 요소를 검색할 Document 객체
     * @param targetId string - 검색할 요소의 data-role
     * @returns SVGTextElement | null - 주어진 data-role와 일치하는 요소 또는 null (찾지 못한 경우)
     */
    private getBrandNameTextElement;
    /**
     * 주어진 요소의 모든 자식을 제거합니다.
     *
     * @param element Element - 자식을 제거할 요소
     */
    private removeAllChildren;
    /**
     * 주어진 SVG 문자열을 파싱하여 새로운 Document 객체를 반환합니다.
     *
     * @param svgString string - 파싱할 SVG 문자열
     * @returns Document - 생성된 Document 객체
     */
    private createDocument;
    /**
     * 주어진 키와 대상 ID를 사용하여 원본 SVG 텍스트 요소를 가져옵니다.
     *
     * @param key - SVG를 저장한 맵에서의 키
     * @returns 대상 ID에 해당하는 SVG 텍스트 요소 또는 null (찾지 못한 경우)
     */
    private getOriginalTextElementInfo;
    /**
     * getTextToSvg 함수는 주어진 Document와 폰트 패밀리에 대한 TextToSVG 인스턴스를 비동기적으로 가져옵니다.
     *
     * @param document - Document 객체
     * @param fontFamily - 폰트 패밀리
     * @returns Promise<TextToSVG | undefined> - TextToSVG 인스턴스 또는 undefined (실패 시)
     */
    private getTextToSvg;
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
    private getMetrics;
    /**
     * getUpdatedBrandNameDy 함수는 주어진 프로퍼티를 사용하여 브랜드 이름의 dy 값을 업데이트합니다.
     *
     * @param key - SVG를 저장한 맵에서의 키
     * @param targetId - 업데이트할 텍스트 요소의 대상 ID
     * @returns number | undefined - 업데이트된 dy 값 또는 undefined (실패 시)
     */
    private getUpdatedBrandNameDy;
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
    private getUpdatedBrandNameY;
    /**
     * getAdjustedFontStyles 함수는 주어진 프로퍼티를 사용하여 조정된 폰트 스타일을 비동기적으로 가져옵니다.
     *
     * @param key - SVG를 저장한 맵에서의 키
     * @param document - Document 객체
     * @param targetId - 대상 요소의 ID
     * @param brandName - 브랜드 이름
     * @returns Promise<GetAdjustedFontSizeResult | undefined> - 조정된 폰트 크기 및 글자 간격 객체 또는 undefined (실패 시)
     */
    private getAdjustedFontStyles;
    /**
     * updateBrandName 함수는 주어진 프로퍼티를 사용하여 브랜드 이름을 업데이트합니다.
     *
     * @param key - SVG를 저장한 맵에서의 키
     * @param targetId - 대상 요소의 ID
     * @param brandName - 업데이트할 브랜드 이름
     * @returns Promise<BoonDrawSVG> - 업데이트된 BoonDrawSVG 객체 또는 현재 객체 (실패 시)
     */
    updateBrandName({ key, targetId, brandName, }: UpdateBrandNameProps): Promise<BoonDrawSVG>;
    /**
     * getDocument 함수는 현재 객체(this)의 문서(document)를 반환합니다.
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @throws {Error} 만약 문서(document)가 초기화되지 않았을 경우 에러를 던집니다.
     * @returns {Document} 현재 객체(this)의 문서(document)를 반환합니다.
     */
    getDocument(key: string): Document;
    /**
     * getSvgString 함수는 현재 객체(this)의 문서(document)를 문자열 형태의 SVG로 직렬화하여 반환합니다.
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @returns {string} 문서(document)를 문자열 형태의 SVG로 직렬화한 결과를 반환합니다.
     */
    getSvgString(key: string): string;
    /**
     * setFullWidth 함수는 SVG 문서 요소의 너비와 높이를 100%로 설정합니다.
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @returns {BoonDrawSVG} 현재 객체(this)를 반환합니다.
     */
    setFullWidth(key: string): BoonDrawSVG;
    /**
     * setUniqueId 함수는 SVG 문자열 내의 모든 요소의 ID를 고유한 값으로 대체합니다.
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @returns {string} 새로운 SVG 문자열
     */
    private replaceUniqueId;
    /**
     * init 메서드는 주어진 키와 SVG 문자열, 대상 요소의 ID를 사용하여 BoonDrawSVG 객체를 초기화합니다.
     *
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @param {string} svgString - SVG 형식의 문자열 데이터
     * @param {string} targetId - 초기화할 텍스트 요소의 대상 ID
     * @returns {BoonDrawSVG} - 이 메서드를 호출한 현재 BoonDrawSVG 객체
     */
    init(key: string, svgString: string, targetId: string): BoonDrawSVG;
    /**
     * initUniqueId 메서드는 주어진 키와 SVG 문자열, 대상 요소의 ID를 사용하여 BoonDrawSVG 객체를 고유하게 초기화합니다.
     *
     * @param {string} key - SVG를 저장할 맵에서의 키
     * @param {string} svgString - SVG 형식의 문자열 데이터
     * @param {string} targetId - 초기화할 텍스트 요소의 대상 ID
     * @returns {BoonDrawSVG} - 이 메서드를 호출한 현재 BoonDrawSVG 객체
     */
    initUniqueId(key: string, svgString: string, targetId: string): BoonDrawSVG;
}

export { BoonDrawSVG };
