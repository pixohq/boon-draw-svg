import '../__mocks__/text-to-svg';

import { BoonDrawSVG } from '../BoonDrawSVG';
import SVG from './assets/1NeyQSMrs46yKycB50n18N.svg';
import SVG_BRAND_NAME from './assets/1nhXKPq4nbiM4LGlrK3opG.svg';
import { SVG_STRING } from './constants';

const TEST_KEY = 'template-key';
const TEST_TARGET_ID = 'brand-name';

describe('BoonDrawSVG 모듈', () => {
  test('생성자 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    expect(boonDrawSvg).not.toBe(null);
  });

  describe('init() 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    test('초기화 테스트', () => {
      expect(boonDrawSvg.init(TEST_KEY, SVG_STRING, TEST_TARGET_ID).getSvgString(TEST_KEY)).toMatch('svg');
    });

    test('아이디가 교체되지 않아야 함', () => {
      expect(boonDrawSvg.init(TEST_KEY, SVG_STRING, TEST_TARGET_ID).getSvgString(TEST_KEY)).toMatch('id="canvas1-clip"');
    });
  });

  describe('initWithUniqueId() 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    test('초기화 테스트', () => {
      expect(boonDrawSvg.initUniqueId(TEST_KEY, SVG_STRING, TEST_TARGET_ID).getSvgString(TEST_KEY)).toMatch('svg');
    });

    test('아이디가 초기화 되어야 함', () => {
      expect(boonDrawSvg.initUniqueId(TEST_KEY, SVG_STRING, TEST_TARGET_ID).getSvgString(TEST_KEY)).not.toMatch('id="canvas1-clip"');
    });
  });

  describe('<text> 테스트', () => {
    test('"A happy accident happened" 텍스트가 존재해야 함', () => {
      const boonDrawSvg = new BoonDrawSVG();
      const svgString = boonDrawSvg.initUniqueId(TEST_KEY, SVG_STRING, TEST_TARGET_ID).getSvgString(TEST_KEY);

      expect(svgString).toMatch('A happy accident happened');
    });

    test('brandNameId가 존재하지 않는 경우 에러가 발생해야 함', async () => {
      const boonDrawSvg = new BoonDrawSVG();

      try {
        await boonDrawSvg
          .initUniqueId(TEST_KEY, SVG, TEST_TARGET_ID)
          .updateBrandName({ key: TEST_KEY, targetId: TEST_TARGET_ID, brandName: 'A New Text' });
      } catch (error) {
        expect(error).toEqual(new Error('텍스트 엘리먼트를 찾을 수 없습니다.'));
      }
    });

    test('brandNameId가 존재하는 경우 텍스트가 변경되어야 함', async () => {
      const boonDrawSvg = new BoonDrawSVG();

      try {
        const svgString = (
          await boonDrawSvg
            .initUniqueId(TEST_KEY, SVG_BRAND_NAME, TEST_TARGET_ID)
            .updateBrandName({ key: TEST_KEY, targetId: TEST_TARGET_ID, brandName: 'A New Text' })
        ).getSvgString(TEST_KEY);

        expect(svgString).toMatch('A New Text');
      } catch (error) {
        console.log(error);
      }
    });
  });
});
