export interface MenuItem {
  titleKey: string;
  descKey: string;
}

export interface MenuCategory {
  titleKey: string;
  items: MenuItem[];
}

export const megaMenuCategories: MenuCategory[] = [
  {
    titleKey: "fireSafety",
    items: [
      { titleKey: "fireCurtains", descKey: "fireCurtainsDesc" },
      { titleKey: "smokeCurtains", descKey: "smokeCurtainsDesc" },
    ],
  },
  {
    titleKey: "rollerShutters",
    items: [
      { titleKey: "industrialDoors", descKey: "industrialDoorsDesc" },
      { titleKey: "residentialDoors", descKey: "residentialDoorsDesc" },
      { titleKey: "garageDoors", descKey: "garageDoorsDesc" },
      { titleKey: "highSpeedDoors", descKey: "highSpeedDoorsDesc" },
      { titleKey: "steelDoors", descKey: "steelDoorsDesc" },
      { titleKey: "louvers", descKey: "louversDesc" },
    ],
  },
  {
    titleKey: "oilGas",
    items: [
      { titleKey: "wellEquipment", descKey: "wellEquipmentDesc" },
      { titleKey: "sensors", descKey: "sensorsDesc" },
      { titleKey: "spareParts", descKey: "sparePartsDesc" },
    ],
  },
  {
    titleKey: "hvac",
    items: [
      { titleKey: "ventilators", descKey: "ventilatorsDesc" },
      { titleKey: "exhaustSystems", descKey: "exhaustSystemsDesc" },
      { titleKey: "vavControls", descKey: "vavControlsDesc" },
      { titleKey: "dampers", descKey: "dampersDesc" },
    ],
  },
  {
    titleKey: "loadingBay",
    items: [
      { titleKey: "dockLevelers", descKey: "dockLevelersDesc" },
      { titleKey: "dockShelters", descKey: "dockSheltersDesc" },
    ],
  },
];
