import React from "react";
import {
  ListItem,
  Tooltip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
} from "@mui/material";

/**
 * ColoredMenuItem - reusable menu item for sidebar with color, icon/avatar, and label
 *
 * @param {object} props
 * @param {string} label - The menu label
 * @param {string} color - The color for icon/avatar and text
 * @param {React.ReactNode} icon - The icon or avatar to display
 * @param {boolean} selected - If the item is selected
 * @param {function} onClick - Click handler
 * @param {boolean} sidebarVisible - If sidebar is expanded
 * @param {string} tooltip - Tooltip text
 * @param {object} [listItemProps] - Additional props for ListItem
 * @param {object} [buttonProps] - Additional props for ListItemButton
 * @param {object} [iconProps] - Additional props for ListItemIcon
 * @param {object} [textProps] - Additional props for ListItemText
 */
export default function ColoredMenuItem({
  label,
  color,
  icon,
  selected,
  onClick,
  sidebarVisible,
  tooltip,
  listItemProps = {},
  buttonProps = {},
  iconProps = {},
  textProps = {},
}) {
  return (
    <ListItem {...listItemProps} sx={{ pl: 0, ...listItemProps.sx }}>
      <Tooltip
        title={tooltip || label}
        placement="right"
        disableHoverListener={sidebarVisible}
      >
        <ListItemButton
          selected={selected}
          onClick={onClick}
          sx={{
            justifyContent: sidebarVisible ? "flex-start" : "center",
            minHeight: 48,
            px: 2.5,
            ...buttonProps.sx,
          }}
          {...buttonProps}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: sidebarVisible ? 3 : "auto",
              justifyContent: "center",
              ...iconProps.sx,
            }}
            {...iconProps}
          >
            {icon}
          </ListItemIcon>
          {sidebarVisible && (
            <ListItemText
              primary={label}
              sx={{ opacity: 1, color, ...textProps.sx }}
              {...textProps}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
}
