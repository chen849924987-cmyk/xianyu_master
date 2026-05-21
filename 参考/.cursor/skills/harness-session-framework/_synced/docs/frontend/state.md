# 状态管理规范

## useState 规范

```typescript
// ✅ 显式类型声明（复杂类型）
const [data, setData] = useState<DataType | null>(null);
const [err, setErr] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

// ✅ 函数式更新（基于前一个状态）
setCount((prev) => prev + 1);

// ✅ 对象状态更新（展开原状态）
setForm((prev) => ({ ...prev, email: value }));
```

## useCallback 规范

```typescript
// ✅ 异步加载使用 useCallback
const load = useCallback(async () => {
  setIsLoading(true);
  try {
    const result = await fetchData();
    setData(result);
    setErr(null);
  } catch (e) {
    setErr(String(e));
  } finally {
    setIsLoading(false);
  }
}, []);  // 空依赖 = 只创建一次

// ✅ 带依赖的回调
const handleSubmit = useCallback(() => {
  submitForm(formData);
}, [formData]);
```

## useEffect 规范

```typescript
// ✅ 加载数据
useEffect(() => {
  void load();
}, [load]);

// ✅ 定时刷新 + 清理
useEffect(() => {
  const id = window.setInterval(() => void load(), 8000);
  return () => window.clearInterval(id);
}, [load]);

// ✅ 监听变化
useEffect(() => {
  if (data && selectedId) {
    const item = data.find((d) => d.id === selectedId);
    setSelected(item);
  }
}, [data, selectedId]);
```

## 表单状态

```typescript
// ✅ 表单状态对象
const [form, setForm] = useState({
  email: "",
  password: "",
  remember: false,
});

// ✅ 通用 change handler
const handleChange = (field: keyof typeof form) => (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
  setForm((prev) => ({ ...prev, [field]: value }));
};

// 使用
<input
  type="email"
  value={form.email}
  onChange={handleChange("email")}
/>
<input
  type="checkbox"
  checked={form.remember}
  onChange={handleChange("remember")}
/>
```

## 避免的状态模式

```typescript
// ❌ 避免：状态与 props 重复
function Component({ initialData }) {
  const [data, setData] = useState(initialData);  // 不必要
  return <div>{data}</div>;
}

// ✅ 直接使用 props
function Component({ data }) {
  return <div>{data}</div>;
}

// ❌ 避免：derived state
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);  // derived from items

useEffect(() => {
  setCount(items.length);  // 不必要
}, [items]);

// ✅ 直接计算
const count = items.length;
```
