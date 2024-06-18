export function varAlpha(color, opacity = 1) {
  // 验证十六进制颜色值格式（简写和完整形式）
  const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!hexRegex.test(color)) {
    throw new Error('Invalid hex color format');
  }

  // 如果是简写形式，将其转换为完整形式
  if (color.length === 4) {
    color = color
      .split('')
      .map((char) => (char === '#' ? char : char + char))
      .join('');
  }

  // 提取并转换十六进制颜色值
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // 返回带有透明度的RGBA颜色字符串
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
