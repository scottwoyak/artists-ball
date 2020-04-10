import { glColor3 } from "./glColor";

export interface IThresholdProvider {
   threshold1: number;
   threshold2: number;
   lightIntensity: number;
   shadow: number;
   highlight: number;
   lightLight: number;
   midLight: number;
   darkLight: number;
   whiteColor: glColor3;
   blackColor: glColor3;
}