import { DropDownMenu, SubMenu } from "./DropDownMenu";

type LoadModelFunction = (file: string) => void;

export function createModelsDropDownMenu(parent: HTMLElement, loadMenu: LoadModelFunction): DropDownMenu {

   let subMenu: SubMenu;
   let menu = new DropDownMenu(parent, 'Models', 'ModelDropDown');
   menu.addItem('Female Pose', () => this.loadModel('Pose1.blob'));
   menu.addItem('Female Head', () => this.loadModel('FemaleHead.blob'));
   menu.addItem('Skull 1', () => this.loadModel('Skull1.blob'));
   menu.addItem('Skull 2', () => this.loadModel('Skull2.blob'));
   menu.addItem('Skull 3', () => this.loadModel('Skull3.blob'));
   menu.addItem('Pelvis', () => this.loadModel('Pelvis.blob'));
   menu.addItem('Head Ecorche', () => this.loadModel('HeadEcorche.blob'));
   menu.addItem('Arnold', () => this.loadModel('Arnold.blob'));
   menu.addItem('Teapot', () => this.loadModel('Teapot.blob'));

   subMenu = menu.addSubMenu('Poses', 'HeadsSubMenu');
   subMenu.addItem('Pose 1', () => this.loadModel('Pose_01.blob'));
   subMenu.addItem('Pose 2', () => this.loadModel('Pose_02.blob'));
   subMenu.addItem('Pose 3', () => this.loadModel('Pose_03.blob'));
   subMenu.addItem('Pose 4', () => this.loadModel('Pose_04.blob'));
   subMenu.addItem('Pose 5', () => this.loadModel('Pose_05.blob'));
   subMenu.addItem('Pose 6', () => this.loadModel('Pose_06.blob'));
   subMenu.addItem('Pose 7', () => this.loadModel('Pose_07.blob'));
   subMenu.addItem('Pose 8', () => this.loadModel('Pose_08.blob'));
   subMenu.addItem('Pose 9', () => this.loadModel('Pose_09.blob'));
   subMenu.addItem('Pose 10', () => this.loadModel('Pose_010.blob'));
   subMenu.addItem('Pose 11', () => this.loadModel('Pose_011.blob'));
   subMenu.addItem('Pose 12', () => this.loadModel('Pose_012.blob'));
   subMenu.addItem('Pose 13', () => this.loadModel('Pose_013.blob'));
   subMenu.addItem('Pose 14', () => this.loadModel('Pose_014.blob'));
   subMenu.addItem('Pose 15', () => this.loadModel('Pose_015.blob'));
   subMenu.addItem('Pose 16', () => this.loadModel('Pose_016.blob'));

   subMenu = menu.addSubMenu('Heads', 'HeadsSubMenu');
   subMenu.addItem('Head 1', () => this.loadModel('Head1.blob'));
   subMenu.addItem('Head 2', () => this.loadModel('Head2.blob'));
   subMenu.addItem('Head 3', () => this.loadModel('Head3.blob'));
   subMenu.addItem('Head 4', () => this.loadModel('Head4.blob'));
   subMenu.addItem('Head 5', () => this.loadModel('Head5.blob'));
   subMenu.addItem('Head 6', () => this.loadModel('Head6.blob'));
   subMenu.addItem('Head 7', () => this.loadModel('Head7.blob'));
   subMenu.addItem('Head 8', () => this.loadModel('Head8.blob'));
   subMenu.addItem('Head 9', () => this.loadModel('Head9.blob'));
   subMenu.addItem('Head 10', () => this.loadModel('Head10.blob'));

   return menu;
}
