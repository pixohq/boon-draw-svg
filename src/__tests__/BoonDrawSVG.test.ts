import { BoonDrawSVG } from '../BoonDrawSVG';
import SVG from './assets/3e5g1A25gtlJdi2mH8z4hk.svg';
import SVG_BRAND_NAME from './assets/3e5g1A25gtlJdi2mH8z4hk-brandNameId.svg';
import {
  SVG_STRING
} from './constants';

jest.mock('text-to-svg', () => {
  const load = (fontURL: string, callback: (error: string, textToSvg: any) => void) => {
    const getMetrics = () => {
      return {
        width: 100,
      };
    };

    callback('', {
      getMetrics,
    });
  };


  return {
    load,
  };
});

describe('BoonDrawSVG 모듈', () => {
  test('생성자 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    expect(boonDrawSvg).not.toBe(null);
  });

  describe('init() 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    test('초기화 테스트', () => {
      expect(boonDrawSvg.init(SVG_STRING).getSvgString()).toMatch('svg');
    });

    test('아이디가 교체되지 않아야 함', () => {
      expect(boonDrawSvg.init(SVG_STRING).getSvgString()).toMatch('id="canvas1-clip"');
    });
  });

  describe('initWithUniqueId() 테스트', () => {
    const boonDrawSvg = new BoonDrawSVG();

    test('초기화 테스트', () => {
      expect(boonDrawSvg.initWithUniqueId(SVG_STRING).getSvgString()).toMatch('svg');
    });

    test('아이디가 초기화 되어야 함', () => {
      expect(boonDrawSvg.initWithUniqueId(SVG_STRING).getSvgString()).not.toMatch('id="canvas1-clip"');
    });
  });

  describe('<text> 테스트', () => {
    test('"A happy accident happened" 텍스트가 존재해야 함', () => {
      const boonDrawSvg = new BoonDrawSVG();
      const svgString = boonDrawSvg.initWithUniqueId(SVG_STRING).getSvgString();

      expect(svgString).toMatch('A happy accident happened');
    });

    test('brandNameId가 존재하지 않는 경우 에러가 발생해야 함', async () => {
      const boonDrawSvg = new BoonDrawSVG();

      try {
        await boonDrawSvg
          .initWithUniqueId(SVG)
          .updateBrandName({ targetId: 'brandName', brandName: 'A New Text' });
      } catch (error) {
        expect(error).toEqual(new Error('텍스트 엘리먼트를 찾을 수 없습니다.'));
      }
    });

    test('brandNameId가 존재하는 경우 텍스트가 변경되어야 함', async () => {
      const boonDrawSvg = new BoonDrawSVG();

      try {
        const svgString = (
          await boonDrawSvg
            .initWithUniqueId(SVG_BRAND_NAME)
            .updateBrandName({ targetId: 'brandName', brandName: 'A New Text' })
        ).getSvgString();

        expect(svgString).toMatch('A New Text');
      } catch (error) {
        console.log(error);
      }
    });
  });
});
