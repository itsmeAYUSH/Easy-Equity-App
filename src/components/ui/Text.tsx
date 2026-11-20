import { Text as NativeText, type TextProps } from "react-native"

const WEIGHT_CLASS = /(^|\s)font-(normal|medium|semibold|bold|extrabold)(\s|$)/

/**
 * Text in Montserrat. Each weight is a separate font file on native, so a
 * `font-*` class picks the face (see tailwind.config.js); text without one gets
 * the regular face here.
 */
export function Text({ className = "", ...props }: TextProps) {
  return <NativeText {...props} className={WEIGHT_CLASS.test(className) ? className : `font-normal ${className}`} />
}
