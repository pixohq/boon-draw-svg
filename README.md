# BoonDrawSVG

- BoonDrawSVG 모듈은 SVG 문자열을 생성, 관리 및 조작하는 데 사용됩니다.
- 이 클래스는 주어진 키에 대한 SVG 문자열을 저장하고 해당 문자열을 이용하여 문서를 만들어내거나 업데이트합니다.
- 또한 텍스트 요소의 폰트 스타일을 조절하고, 특정 요소의 위치를 계산하여 업데이트하는 등의 기능을 제공합니다.

## 설치

```bash
npm install https://github.com/pixohq/BoonDrawSVG
```

## 사용법

```javascript
import { BoonDrawSVG } from 'boon-draw-svg';

// BoonDrawSVG 객체 생성
const boonDrawSVG = new BoonDrawSVG();

// 초기화
boonDrawSVG.init(key, svgString, targetId);

// 브랜드 이름 업데이트
boonDrawSVG.updateBrandName({ key, targetId, brandName });
```

## 기능

- **SVG 문자열 초기화**: 주어진 SVG 문자열과 특정 요소의 ID를 사용하여 BoonDrawSVG 객체를 초기화합니다.
- **브랜드 이름 업데이트**: 주어진 키와 대상 ID를 사용하여 브랜드 이름을 업데이트합니다.

## 예시

```javascript
import { BoonDrawSVG } from 'boon-draw-svg';

// BoonDrawSVG 객체 생성
const boonDrawSVG = new BoonDrawSVG();

// 초기화
boonDrawSVG.init('key1', '<svg>...</svg>', 'targetId1');

// 브랜드 이름 업데이트
boonDrawSVG.updateBrandName({ key: 'key1', targetId: 'targetId1', brandName: 'New Brand' });
```

## 기여

기여는 언제나 환영입니다! 버그를 찾았거나 새로운 기능을 추가하고 싶으시다면 이슈를 올려주시거나 풀 리퀘스트를 보내주세요.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE.md](LICENSE.md)를 참조해주세요.
