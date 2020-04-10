import { DropDownMenu, SubMenu } from "./DropDownMenu";

type LoadModelFunction = (file: string) => void;

export function createModelsDropDownMenu(parent: HTMLElement, loadModel: LoadModelFunction): DropDownMenu {

   let subMenu: SubMenu;
   let menu = new DropDownMenu(parent, 'Models', 'ModelDropDown');
   menu.addItem('Female Pose', () => loadModel('Pose1.blob'));
   menu.addItem('Female Head', () => loadModel('FemaleHead.blob'));
   menu.addItem('Arnold', () => loadModel('Arnold.blob'));
   menu.addItem('Teapot', () => loadModel('Teapot.blob'));

   subMenu = menu.addSubMenu('Anatomy', 'AnatomySubMenu');
   subMenu.addItem('Skull 1', () => loadModel('Skull1.blob'));
   subMenu.addItem('Skull 2', () => loadModel('Skull2.blob'));
   subMenu.addItem('Skull 3', () => loadModel('Skull3.blob'));
   subMenu.addItem('Skull 4', () => loadModel('Skull4.blob'));
   subMenu.addItem('Pelvis', () => loadModel('Pelvis.blob'));
   subMenu.addItem('Clavicle', () => loadModel('Clavicle.blob'));
   subMenu.addItem('Scapula', () => loadModel('Scapula.blob'));
   subMenu.addItem('Humerus', () => loadModel('Humerus.blob'));
   subMenu.addItem('Head Ecorche', () => loadModel('HeadEcorche.blob'));
   subMenu.addItem('Head Ecorche 2', () => loadModel('HeadEcorche2.blob'));
   subMenu.addItem('Head Ecorche 3', () => loadModel('HeadEcorche3.blob'));
   subMenu.addItem('Head Ecorche 4', () => loadModel('HeadEcorche4.blob'));

   subMenu = menu.addSubMenu('Poses', 'HeadsSubMenu');
   subMenu.addItem('Pose 1', () => loadModel('Pose_01.blob'));
   subMenu.addItem('Pose 2', () => loadModel('Pose_02.blob'));
   subMenu.addItem('Pose 3', () => loadModel('Pose_03.blob'));
   subMenu.addItem('Pose 4', () => loadModel('Pose_04.blob'));
   subMenu.addItem('Pose 5', () => loadModel('Pose_05.blob'));
   subMenu.addItem('Pose 6', () => loadModel('Pose_06.blob'));
   subMenu.addItem('Pose 7', () => loadModel('Pose_07.blob'));
   subMenu.addItem('Pose 8', () => loadModel('Pose_08.blob'));
   subMenu.addItem('Pose 9', () => loadModel('Pose_09.blob'));
   subMenu.addItem('Pose 10', () => loadModel('Pose_010.blob'));
   subMenu.addItem('Pose 11', () => loadModel('Pose_011.blob'));
   subMenu.addItem('Pose 12', () => loadModel('Pose_012.blob'));
   subMenu.addItem('Pose 13', () => loadModel('Pose_013.blob'));
   subMenu.addItem('Pose 14', () => loadModel('Pose_014.blob'));
   subMenu.addItem('Pose 15', () => loadModel('Pose_015.blob'));
   subMenu.addItem('Pose 16', () => loadModel('Pose_016.blob'));

   subMenu = menu.addSubMenu('Heads', 'HeadsSubMenu');
   subMenu.addItem('Head 1', () => loadModel('Head1.blob'));
   subMenu.addItem('Head 2', () => loadModel('Head2.blob'));
   subMenu.addItem('Head 3', () => loadModel('Head3.blob'));
   subMenu.addItem('Head 4', () => loadModel('Head4.blob'));
   subMenu.addItem('Head 5', () => loadModel('Head5.blob'));
   subMenu.addItem('Head 6', () => loadModel('Head6.blob'));
   subMenu.addItem('Head 7', () => loadModel('Head7.blob'));
   subMenu.addItem('Head 8', () => loadModel('Head8.blob'));
   subMenu.addItem('Head 9', () => loadModel('Head9.blob'));
   subMenu.addItem('Head 10', () => loadModel('Head10.blob'));
   subMenu.addItem('Head 11', () => loadModel('Head.blob'));

   return menu;
}
