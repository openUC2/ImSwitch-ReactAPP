import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";

/**
 * DrawerEntry - A reusable sidebar menu entry for the Drawer.
 * Props:
 * - icon: React element (icon or avatar)
 * - label: string (menu label)
 * - selected: boolean (highlight if selected)
 * - onClick: function (handler for click)
 * - tooltip: string (optional, for collapsed sidebar)
 * - color: string (optional, background or icon color)
 * - collapsed: boolean (if sidebar is collapsed)
 */
const DrawerEntry = ({
  icon,
  label,
  selected = false,
  onClick,
  tooltip = "",
  color,
  collapsed = false,
}) => {
  const entry = (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{ minHeight: 48 }}
    >
      <ListItemIcon
        sx={{
          color: color || "inherit",
          minWidth: 0,
          mr: collapsed ? "auto" : 3,
          justifyContent: "center",
        }}
      >
        {icon}
      </ListItemIcon>
      {!collapsed && <ListItemText primary={label} />}
    </ListItemButton>
  );
  return tooltip && collapsed ? (
    <Tooltip title={tooltip || label} placement="right">
      {entry}
    </Tooltip>
  ) : (
    entry
  );
};

export default DrawerEntry;
