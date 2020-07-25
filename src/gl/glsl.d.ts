//
// This enables import statements in Typescript for files of type .glsl
//
declare module '*.glsl' {
   const value: string
   export default value
}