/** 纯数据：驱动 `isLikelyFxgLoginWall` 的表驱动用例（与实现口径对齐，见 src/utils/doudian-password-login.ts） */
export type LoginWallCase = {
  label: string;
  url: string;
  expected: boolean;
};

export const loginWallCases: LoginWallCase[] = [
  {
    label: "工作台 pathname 不算登录墙",
    url: "https://fxg.jinritemai.com/ffa/mshop/homepage/index",
    expected: false,
  },
  {
    label: "登录路径算登录墙",
    url: "https://fxg.jinritemai.com/login/common",
    expected: true,
  },
  {
    label: "passport 路径",
    url: "https://fxg.jinritemai.com/passport/web",
    expected: true,
  },
  {
    label: "sso 子域",
    url: "https://sso.example.com/foo/login",
    expected: true,
  },
  {
    label: "URL 含「扫码」",
    url: "https://fxg.jinritemai.com/foo?x=扫码",
    expected: true,
  },
  {
    label: "工作台 + 查询串仍非墙",
    url: "https://fxg.jinritemai.com/ffa/mshop/homepage/index?tab=1",
    expected: false,
  },
  {
    label: "非法 URL 字符串回退为 pathname 匹配",
    url: "/login/common",
    expected: true,
  },
  {
    label: "binding 路径",
    url: "https://fxg.jinritemai.com/binding/phone",
    expected: true,
  },
];
