import React, { useState, useMemo } from "react";
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import { generateLabelUnit } from '../../label-unit';

import CustomButton from "../../custom-button";
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Typography, TextField, Box } from "@mui/material";

export function CheckboxesForAttributeValues({
  attributeKey,
  attributeLabel,
  attributeValues: options,
  selectedAttrKeysVsValues,
  handleAttributeItemClick,
  initialVisibleCount = 5
}) {

  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔤 Sort alphabetically (case-insensitive)
  const sorted = useMemo(() => {
    return [...options].sort((a, b) =>
      a.value.toString().localeCompare(b.value.toString(), undefined, { sensitivity: "base" })
    );
  }, [options]);

  // 🔍 Filter by search term
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sorted;
    return sorted.filter(opt =>
      opt.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sorted]);

  // 👀 Visible options based on show more/less
  const visibleOptions = showAll
    ? filtered
    : filtered.slice(0, initialVisibleCount);

  // Helper to render checkboxes
  const renderOptions = (opts, prefix) =>
    opts.map((option, index) => {
      const labelId = `checkbox-${attributeKey}-${prefix}-${index}`;

      return (
        <label key={index} htmlFor={labelId} className="hover-label">
          <ListItem
            secondaryAction={<Typography sx={{ fontSize: '13px' }}>({option.count})</Typography>}
            disablePadding
          >
            <ListItemButton style={{ paddingLeft: 0 }} dense>
              <ListItemIcon style={{ display: 'flex', justifyContent: 'center' }}>
                <Checkbox
                  onClick={() => handleAttributeItemClick(attributeKey, attributeLabel, option.value)}
                  tabIndex={-1}
                  className="cb-filter-item"
                  sx={{
                    '& .MuiSvgIcon-root': { fontSize: '20px' },
                  }}
                  id={labelId}
                  checked={selectedAttrKeysVsValues[attributeKey]?.includes(option.value) || false}
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>

              <ListItemText
                id={labelId}
                primary={
                  <Typography sx={{ fontSize: '16px',textTransform:'capitalize' }}>
                    {option.value + generateLabelUnit(attributeKey, option.value)}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        </label>
      );
    });

  return (
    <>
      {/* 🔍 Search box */}

      {
        options.length > 5 ? (
      <Box sx={{ p: 1, pb: 1 }}>
        <TextField
          size="small"
          placeholder={`Search ${attributeLabel}...`}
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            "& .MuiInputBase-root": { borderRadius: "8px", fontSize: "14px" }
          }}
        />
      </Box>


        ) : <></>
      }


      {/* Render filtered + sorted options */}
      {renderOptions(visibleOptions, "options")}

      {/* Show More / Less */}
      {filtered.length > initialVisibleCount && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <CustomButton
            startDecorator={<UnfoldMoreIcon />}
            variant="text"
            onClick={() => setShowAll(prev => !prev)}
            sx={{ padding: "8px 10px", fontSize: "14px" }}
          >
            {showAll
              ? "Show Less"
              : `Show More (${filtered.length - initialVisibleCount})`}
          </CustomButton>
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <Typography
          sx={{ textAlign: "center", fontSize: "13px", opacity: 0.6, mt: 1 }}
        >
          No matching options
        </Typography>
      )}
    </>
  );
}
