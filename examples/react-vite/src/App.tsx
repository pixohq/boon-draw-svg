import { useEffect, useRef, useState } from 'react'
import { BoonDrawSVG } from 'boon-draw-svg';
// * SVG asset에서 `[<!ENTITY nbsp "&#160;">]` 이 부분이 불필요하게 포함되어 있음 -> SVG 최적화 필요
import SVG1 from './assets/6DecQXLpmG9WZJm9f3rVjg.svg'
import SVG2 from './assets/6DecQXLpmG9WZJm9f3rVjg-brandName.svg';

interface ItemProps {
  boonDrawer: BoonDrawSVG;
  id: string;
  targetId: string;
  templateSvg: string;
  brandName?: string;
}

const fetchSvg = async (url: string, brandName?: string) => {
  // 쿼리스트링 매개변수 객체
  const queryParams = brandName ? { brandName } : undefined;

  // URL에 쿼리스트링 추가
  const queryString = new URLSearchParams(queryParams).toString();

  const res = await fetch(`${url}?${queryString}`);

  return await res.text();
}

const getQueryString = (key: string) => {
  const params = new URLSearchParams(window.location.search);

  return params.get(key) ?? undefined;
};

const svgs: { key: string; targetId: string; templateSvg: string; }[] = [
  // 로컬 파일 테스트
  { key: 'svg1', targetId: '', templateSvg: SVG1 },
  { key: 'svg2', targetId: 'target-dataId', templateSvg: SVG2 },

  // 서버 연동 테스트
  // { key: 'svg3', targetId: '', templateSvg: 'http://localhost:3000/svg/6DecQXLpmG9WZJm9f3rVjg' },
  // { key: 'svg4', targetId: 'target-dataId', templateSvg: 'http://localhost:3000/svg/6DecQXLpmG9WZJm9f3rVjg-brandName' },
];

function App() {
  const boonDrawerRef = useRef(new BoonDrawSVG());
  const boonDrawer = boonDrawerRef.current;

  const [brandName, setBrandName] = useState<string>(getQueryString('brandName') ?? '');

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          value={brandName} 
          onChange={(e) => setBrandName(e.currentTarget.value)} 
          style={{
            width: 500,
            height: 50,
            padding: 16
          }}
          />
        <hr />
        {svgs.map(({ key, targetId, templateSvg }, index) => {
          return (
            <div 
              key={index}
              style={{
                maxWidth: 500,
                maxHeight: 500,
                padding: 24
              }}
            >
              <Item
                boonDrawer={boonDrawer} 
                id={key} 
                targetId={targetId} 
                templateSvg={templateSvg}
                brandName={brandName}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}

const Item = ({ boonDrawer, id: key, targetId, templateSvg, brandName }: ItemProps) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [svgString, setSvgString] = useState<string>(templateSvg);

  useEffect(() => {
    fetchSvg(templateSvg, brandName)
      .then(async (svgString) => {
        svgString = (brandName ? (
            await boonDrawer
            // .init(key, svgString, targetId)
            .initUniqueId(key, svgString, targetId)
            .updateBrandName({ key, brandName, targetId })
          ) : (boonDrawer
            .initUniqueId(key, svgString, targetId)))
          .setFullWidth(key)
          .getSvgString(key);

        setSvgString(svgString);
      }).finally(() => {
        setIsLoaded(true);
      })
  }, [boonDrawer, key, targetId, templateSvg]);

  useEffect(() => {
    if (isLoaded === false) return;
    if (brandName) {
      (async () => {
        const svgString = (await boonDrawer
          .updateBrandName({ key, targetId, brandName }))
          .getSvgString(key);

        setSvgString(svgString);
      })()
    }
  }, [brandName])

  return <div dangerouslySetInnerHTML={{ __html: svgString }} />
}

export default App
