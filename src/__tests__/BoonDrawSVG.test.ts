import { BoonDrawSVG } from "../BoonDrawSVG";
import TestSVG from "./assets/2vgSysL6vxCNg6zVimTTKM.svg";

test("BoonDrawSvg 테스트", () => {
  const boonDrawSvg = new BoonDrawSVG(TestSVG, {
    fullWidth: true,
  });

  expect(boonDrawSvg).not.toBe(null);
});
