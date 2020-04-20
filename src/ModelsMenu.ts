import { Menubar } from "./Menu";

type LoadModelFunction = (file: string) => void;

interface iSubMenu {
   label: string,
   id: string,
   menuItems: (iSubMenu | IMenuItemSetup)[]
}
interface IMenuItemSetup {
   label: string,
   file: string,
}

let menuItems: (iSubMenu | IMenuItemSetup)[] = [
   {
      label: 'Objects', id: 'ObjectsSubMenu', menuItems: [
         { label: 'Football', file: 'Football.blob' },
         { label: 'Pill', file: 'Pill.blob' },
         { label: 'Pill Bottle', file: 'PillBottle.blob' },
         { label: 'Soda Can', file: 'SodaCan.blob' },
         { label: 'Soccer Ball', file: 'SoccerBall.blob' },
         { label: 'Spoon', file: 'Spoon.blob' },
         { label: 'Teapot', file: 'Teapot.blob' },
         { label: 'Torus (Donut)', file: 'Torus.blob' },
         { label: 'Torus Knot', file: 'TorusKnot.blob' },
         { label: 'Vase', file: 'Vase.blob' },
         { label: 'Vitamin', file: 'Vitamin.blob' },
         { label: 'Wine Bottle', file: 'WineBottle.blob' },
      ]
   },
   {
      label: 'Sculptures', id: 'SculpturesSubMenu', menuItems: [
         { label: 'Belvedere Torso', file: 'BelvedereTorso.blob' },
         { label: 'David', file: 'David.blob' },
         { label: 'Head of David', file: 'HeadOfDavid.blob' },
         { label: 'Lacoon and His Sons', file: 'LaocoonAndHisSons.blob' },
         { label: 'Nefertiti', file: 'Nefertiti.blob' },
         { label: 'Thinker', file: 'Thinker.blob' },
         { label: 'Venus de Milo', file: 'VenusDeMilo.blob' },
         { label: 'Venus of Willendorf', file: 'VenusOfWillendorf.blob' },
         { label: 'Winged Victory of Samothrace', file: 'WingedVictory.blob' },
         { label: 'Winged Victory of Samothrace w/Base', file: 'WingedVictoryWithBase.blob' },
      ]
   },
   {
      label: 'Anatomy', id: 'AnatomySubMenu', menuItems: [
         { label: 'Skull 1', file: 'Skull1.blob' },
         { label: 'Skull 2', file: 'Skull2.blob' },
         { label: 'Skull 3', file: 'Skull3.blob' },
         { label: 'Skull 4', file: 'Skull4.blob' },
         { label: 'Pelvis', file: 'Pelvis.blob' },
         { label: 'Clavicle', file: 'Clavicle.blob' },
         { label: 'Scapula', file: 'Scapula.blob' },
         { label: 'Humerus', file: 'Humerus.blob' },
         { label: 'Head Ecorche', file: 'HeadEcorche.blob' },
         { label: 'Head Ecorche 2', file: 'HeadEcorche2.blob' },
         { label: 'Head Ecorche 3', file: 'HeadEcorche3.blob' },
         { label: 'Head Ecorche 4', file: 'HeadEcorche4.blob' },
      ]
   },
   {
      label: 'Anatomy', id: 'AnatomySubMenu', menuItems: [
         { label: 'Skull 1', file: 'Skull1.blob' },
         { label: 'Skull 2', file: 'Skull2.blob' },
         { label: 'Skull 3', file: 'Skull3.blob' },
         { label: 'Skull 4', file: 'Skull4.blob' },
         { label: 'Pelvis', file: 'Pelvis.blob' },
         { label: 'Clavicle', file: 'Clavicle.blob' },
         { label: 'Scapula', file: 'Scapula.blob' },
         { label: 'Humerus', file: 'Humerus.blob' },
         { label: 'Head Ecorche', file: 'HeadEcorche.blob' },
         { label: 'Head Ecorche 2', file: 'HeadEcorche2.blob' },
         { label: 'Head Ecorche 3', file: 'HeadEcorche3.blob' },
         { label: 'Head Ecorche 4', file: 'HeadEcorche4.blob' },
      ]
   },
   {
      label: 'Poses', id: 'PosesSubMenu', menuItems: [
         { label: 'Pose 1', file: 'Pose_01.blob' },
         { label: 'Pose 2', file: 'Pose_02.blob' },
         { label: 'Pose 3', file: 'Pose_03.blob' },
         { label: 'Pose 4', file: 'Pose_04.blob' },
         { label: 'Pose 5', file: 'Pose_05.blob' },
         { label: 'Pose 6', file: 'Pose_06.blob' },
         { label: 'Pose 7', file: 'Pose_07.blob' },
         { label: 'Pose 8', file: 'Pose_08.blob' },
         { label: 'Pose 9', file: 'Pose_09.blob' },
         { label: 'Pose 10', file: 'Pose_010.blob' },
         { label: 'Pose 11', file: 'Pose_011.blob' },
         { label: 'Pose 12', file: 'Pose_012.blob' },
         { label: 'Pose 13', file: 'Pose_013.blob' },
         { label: 'Pose 14', file: 'Pose_014.blob' },
         { label: 'Pose 15', file: 'Pose_015.blob' },
         { label: 'Pose 16', file: 'Pose_016.blob' },
         { label: 'Female Pose', file: 'Pose1.blob' },
      ]
   },
   {
      label: 'Heads', id: 'HeadsSubMenu', menuItems: [
         { label: 'Head 1', file: 'Head1.blob' },
         { label: 'Head 2', file: 'Head2.blob' },
         { label: 'Head 3', file: 'Head3.blob' },
         { label: 'Head 4', file: 'Head4.blob' },
         { label: 'Head 5', file: 'Head5.blob' },
         { label: 'Head 6', file: 'Head6.blob' },
         { label: 'Head 7', file: 'Head7.blob' },
         { label: 'Head 8', file: 'Head8.blob' },
         { label: 'Head 9', file: 'Head9.blob' },
         { label: 'Head 10', file: 'Head10.blob' },
         { label: 'Head 11', file: 'Head.blob' },
         { label: 'Female Head', file: 'FemaleHead.blob' },
         { label: 'Arnold', file: 'Arnold.blob' },
      ]
   },
   {
      label: 'Expressions', id: 'ExpressionsSubMenu', menuItems: [
         {
            label: 'Neutral', id: 'NeutralSubMenu', menuItems: [
               { label: 'Neutral', file: 'Male_02_01_Neutral.blob' },
               { label: 'Neutral, Eyes Closed', file: 'Male_02_02_Neutral_Eyes_Closed.blob' },
               { label: 'Neutral, Lips Parted', file: 'Male_02_038_Neutral_Lips_Parted.blob' },
            ]
         },
         {
            label: 'Eyes', id: 'EyesSubMenu', menuItems: [
               { label: 'Look Up', file: 'Male_02_05_Look_Up.blob' },
               { label: 'Look Down', file: 'Male_02_06_Look_Down.blob' },
               { label: 'Look Left', file: 'Male_02_07_Look_Left.blob' },
               { label: 'Look Right', file: 'Male_02_08_Look_Right.blob' },
               { label: 'Brows Up', file: 'Male_02_016_Brows_Up.blob' },
               { label: 'Brows Down', file: 'Male_02_017_Brows_Down.blob' },
            ]
         },
         {
            label: 'Jaw', id: 'JawSubMenu', menuItems: [
               { label: 'Wide Open', file: 'Male_02_09_Jaw_Wide_Open.blob' },
               { label: 'Side Right', file: 'Male_02_018_Jaw_Side_Right.blob' },
               { label: 'Side Left', file: 'Male_02_019_Jaw_Side_Left.blob' },
               { label: 'Thrust', file: 'Male_02_020_Jaw_Thrust.blob' },
               { label: 'Clench', file: 'Male_02_021_Jaw_Clench.blob' },
            ]
         },
         {
            label: 'Cheeks', id: 'CheeksSubMenu', menuItems: [
               { label: 'Puff', file: 'Male_02_022_Cheek_Puff.blob' },
               { label: 'Suck', file: 'Male_02_023_Cheek_Suck.blob' },
               { label: 'Dimple', file: 'Male_02_027_Dimple_Cheeks.blob' },
            ]
         },
         {
            label: 'Lips', id: 'LipsSubMenu', menuItems: [
               { label: 'Tighten', file: 'Male_02_010_Tighten Lips.blob' },
               { label: 'Pucker', file: 'Male_02_012_Pucker.blob' },
               { label: 'Flare', file: 'Male_02_026_Flare_Lips.blob' },
               { label: 'Sounds: "CH"', file: 'Male_02_024_Phoneme_CH.blob' },
               { label: 'Sounds: "FV"', file: 'Male_02_025_Phoneme_FV.blob' },
            ]
         },
         {
            label: 'Emotions', id: 'EmotionsSubMenu', menuItems: [
               { label: 'Smile, Mouth Closed', file: 'Male_02_03_Smile_Mouth_Closed.blob' },
               { label: 'Smile, Mouth Open', file: 'Male_02_04_Smile_Mouth_Open.blob' },
               { label: 'Snarl', file: 'Male_02_013_Snarl.blob' },
               { label: 'Frown', file: 'Male_02_014_Frown.blob' },
               { label: 'Happy', file: 'Male_02_028_Happy.blob' },
               { label: 'Surprise', file: 'Male_02_029_Surprise.blob' },
               { label: 'Sad', file: 'Male_02_030_Sad.blob' },
               { label: 'Angry', file: 'Male_02_031_Angry.blob' },
               { label: 'Pain', file: 'Male_02_032_Pain.blob' },
               { label: 'Fear', file: 'Male_02_033_Fear.blob' },
               { label: 'Disgust', file: 'Male_02_034_Disgust.blob' },
               { label: 'Shock', file: 'Male_02_035_Shock.blob' },
               { label: 'Rage', file: 'Male_02_036_Rage.blob' },
            ]
         },
         {
            label: 'Other', id: 'OtherSubMenu', menuItems: [
               { label: 'Face Compression', file: 'Male_02_011_Face_Compression.blob' },
               { label: 'Neck Tighten', file: 'Male_02_015_Neck_Tighten.blob' },
               { label: 'Tongue', file: 'Male_02_037_Tongue.blob' },
            ]
         },
      ]
   },

];

function addItems(menu: Menubar, items: (IMenuItemSetup | iSubMenu)[], loadModel: LoadModelFunction) {
   items.forEach((item) => {
      if ('menuItems' in item) {
         let subMenu = menu.addSubMenu(item.label, item.id);
         addItems(subMenu, item.menuItems, loadModel);
      }
      else {
         menu.addItem(item.label, () => { loadModel(item.file) });
      }
   });
}

export function createModelsMenu(menubar: Menubar, loadModel: LoadModelFunction) {

   let menu = menubar.addSubMenu('Models', 'Models');

   addItems(menu, menuItems, loadModel);
}
