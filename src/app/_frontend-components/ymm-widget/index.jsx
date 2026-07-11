"use client";
import { CircularProgress, NativeSelect } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  useMediaQuery,
} from "@mui/material";


import { useTheme } from "@mui/material/styles";

import CustomButton from "../custom-button";

const Button = CustomButton

const STORAGE_KEY = "ymm_history";

export default function YMMwidget({
  endpoint,
  orientation = "vertical",
  buttonLabel = "Search",
  heading = "Select Your Vehicle",
  callback = () => {},
  containerStyles ={},
  buttonStyles={},
  headingStyles={},
  selectDisabledOpacity=1,
  selectLoadingOpacity=1
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isButtonLoading, setButtonLoading] = useState(false)

  const [dropdowns, setDropdowns] = useState({
    // vehicle_types: [],
    years: [],
    makes: [],
    models: [],
  });

  const [schema, setSchema] = useState({});
  const [fields, setFields] = useState([]);

  const [selected, setSelected] = useState({});
  const [loadingField, setLoadingField] = useState("");

  const [autoSave, setAutoSave] = useState(false)
   

  // ------------------------------
  // SORT OPTIONS
  // ------------------------------
  function sortOptions(arr) {
    if (!arr || arr.length === 0) return [];
    const numeric = arr.every((x) => /^\d+$/.test(x.key));
    return numeric
      ? [...arr].sort((a, b) => Number(b.key) - Number(a.key))
      : [...arr].sort((a, b) => a.label.localeCompare(b.label));
  }

  // ------------------------------
  // BUILD QUERY PARAMS
  // ------------------------------
  function buildQueryParams(sel) {
    const cleaned = {};

    for (const f of Object.keys(sel)) {
      const val = sel[f];
      if (!val) continue;
      const backend = schema[f]?.backend;
      if (backend) cleaned[backend] = val;
    }

    return new URLSearchParams(cleaned).toString();
  }

  // ------------------------------
  // FETCH SINGLE LEVEL
  // ------------------------------
  async function fetchLevelData(sel = {}) {
    const params = buildQueryParams(sel);

    const url =
      params.length > 0
        ? `${endpoint}/api/1storefront/dropdowns?${params}`
        : `${endpoint}/api/1storefront/dropdowns`;


    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) return;

    // Load schema once
    if (Object.keys(schema).length === 0) {
      setSchema(json.schema);
      setFields(
        Object.keys(json.schema).sort(
          (a, b) => json.schema[a].sort_order - json.schema[b].sort_order
        )
      );
    }

    setDropdowns((prev) => {
      const updated = { ...prev };
      
      const returnedLevel = Object.keys(json.dropdowns).find(
        (k) => json.dropdowns[k]?.length > 0
      );

      if (returnedLevel) {
        updated[returnedLevel] = json.dropdowns[returnedLevel];
      }

      console.log("updated", updated)

      return updated;
    });

    setLoadingField("");
  }

  // ------------------------------
  // INITIAL LOAD (load Years)
  // ------------------------------
  useEffect(() => {
    setLoadingField("years");
    fetchLevelData({});
  }, []);

  // ------------------------------
  // AUTO RESTORE SELECTED VEHICLE
  // ------------------------------
  useEffect(() => {
    if (fields.length === 0) return;

    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const chosen =
      arr.find((v) => v.selectedFlag) ||
      arr.sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!chosen?.selected) return;

    setSelected(chosen.selected);

    (async () => {
      let partial = {};

      for (const f of fields) {
        if (!chosen.selected[f]) continue;

        partial[f] = chosen.selected[f];

        const idx = fields.indexOf(f);

        // 🚫 DO NOT FETCH FOR LAST LEVEL DURING RESTORE
        if (idx === fields.length - 1) continue;

        await fetchLevelData(partial);
      }
    })();

  }, [fields]);

  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      saveAndSubmit();
    }, 200); // delay AFTER state updated

    return () => clearTimeout(timer);

  }, [autoSave]);


  // ------------------------------
  // HANDLE USER CHANGE
  // ------------------------------

  async function handleChange(level, value) {
    const idx = fields.indexOf(level);
    const isLastField = idx === fields.length - 1;

    // 🚫 STOP SERVER REQUEST if last dropdown
    if (isLastField) {
      setAutoSave(true)
      setSelected((prev) => ({ ...prev, [level]: value }));
      // alert(2)
      
      // alert(1)
      return;
    }

    const newSel = { ...selected, [level]: value };

    // Reset deeper levels
    for (let i = idx + 1; i < fields.length; i++) {
      newSel[fields[i]] = "";
    }

    setSelected(newSel);

    const nextField = fields[idx + 1];
    setLoadingField(nextField);

    await fetchLevelData(newSel);
  }

  // ------------------------------
  // SAVE + CALLBACK
  // ------------------------------
  function saveAndSubmit() {
    const full = fields.every((f) => selected[f]);
    if (!full) return;

    // Build fullObj
    const fullObj = {};
    for (const f of fields) {
      const opt = dropdowns[f].find((o) => o.key.toString() === selected[f].toString());
      if (!opt) continue; // ignore safety
      fullObj[f] = { key: opt.key, label: opt.label };
    }

    const finalVehicle = {
      selected: { ...selected },
      fullObj,
      timestamp: Date.now(),
      selectedFlag: true,
    };

    let arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    // RESET all selected flags
    arr = arr.map((v) => ({ ...v, selectedFlag: false }));

    // ---- 🔥 DEDUPLICATION FIX ----
    const existsIndex = arr.findIndex((v) =>
      fields.every((f) => v.selected?.[f] === selected[f])
    );

    if (existsIndex !== -1) {
      // update existing record
      arr[existsIndex] = {
        ...arr[existsIndex],
        timestamp: Date.now(),
        selectedFlag: true,
        fullObj
      };
    } else {
      // add new record
      arr.push(finalVehicle);
    }
    // ------------------------------

    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

    setButtonLoading(true)

    callback();
  }

  // ------------------------------
  // RENDER
  // ------------------------------

  if(  
        loadingField == "years" )

            return <Box sx={{textAlign: 'center', padding:'50px'}}>
                <CircularProgress sx={{color: '#0B33A0'}} />
            </Box>
      



  return (
    <Box
      sx={{...containerStyles, borderRadius:'6px', margin: {md: '0 auto'},   maxWidth: {md: '1200px'}}}
    >
      <Typography   sx={{textAlign:'center',fontWeight: 'bold',  fontSize: {xs: '20px', md:'25px'} , ...headingStyles } } mb={2.5}>
        {heading}
      </Typography>

      <Stack
        direction={isMobile ? "column" : orientation === "horizontal" ? "row" : "column"}
        spacing={isMobile? 2.5:2}
      >
        {fields.map((field, idx) => {
          let label =
            loadingField === field ? "Loading…" : schema[field]?.label;

            if(label != "Loading…" && dropdowns[field].length == 0 ){
                label = schema[field]?.label 
            }

            if(label != "Loading…" && dropdowns[field].length > 0 && selected[field] ){
                label = ""
            }


            const nextToSelect = fields.find((f) => !selected[f]);
            const isActive = nextToSelect === field;

            console.log("field",field)
            console.log("dropdowns[field].length > 0", dropdowns[field].length > 0)
            console.log(selected[field])
            let disabled = ( idx > 0 && !selected[fields[idx - 1]] ) || dropdowns[field].length == 0;

            // if(label == "Loading…") disabled = false

            let opacity = disabled ? selectDisabledOpacity: 1

             if(label == "Loading…") opacity = selectLoadingOpacity
             if(label == "Loading…") disabled = true


          return (
        

<>
  <style>{`
    .select {
      width: 100%;
      height: 52px;
      padding: 0 45px 0 18px;
      border-radius: 4px;
      border: 2px solid rgba(0,0,0,0.3);
      background: white;
      font-size: 15px;
      font-weight: 500;
      color: #1e293b;
      appearance: none;
      outline: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    @media(max-width:1024px){
      border: 1px solid rgba(0,0,0,0.3);
    }
    @media(min-width:1024px){
      .select:hover:not(:disabled) {
        border-color: rgba(0,0,0,0.6);
        background: #fafbff;
        box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
        transform: translateY(-1px);
      }
    }

    .select:focus {
      background: #ffffff;
      transform: translateY(-2px);
    }

    .select:disabled {
      background: #f8fafc;
      border-color: #e2e8f0;
      cursor: not-allowed;
      color: #94a3b8;
      opacity: 1;
    }

    .select-wrap {
      position: relative;
      flex: 1;
      min-width: 0;
    }

    /* NO GLOW BY DEFAULT */
    .select-wrap .select {
      /* Normal state - no glow */
    }

    /* ONLY glow when explicitly marked */
    .select-wrap[data-glow="true"] .select {
      border-color: #2088e0 !important;
      background: #ffffff !important;
       box-shadow: 0 6px 14px rgba(32, 136, 224, 0.5) !important;
      //box-shadow: 0 5px 10px rgba(32, 136, 224, 0.35);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 6px 16px rgba(32, 136, 224, 0.4) !important;
      }
      50% {
        box-shadow: 0 8px 24px rgba(32, 136, 224, 0.5) !important;
      }
    }

    .select-wrap[data-glow="true"] .select:hover:not(:disabled) {
      border-color: #1e7acc !important;
      box-shadow: 0 8px 24px rgba(32, 136, 224, 0.5) !important;
    }

    /* Arrow icon */
    .select-wrap::after {
      content: "";
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(0, 0,0,0.4) ;
      pointer-events: none;
      transition: all 0.3s ease;
    }

    .select-wrap:hover:not(:has(.select:disabled))::after {
      border-top-color: #black;
      transform: translateY(-50%) scale(1.2);
    }

    .select-wrap[data-glow="true"]::after {
      border-top-color: #1e7acc !important;
      animation: bounce-arrow 1.5s ease-in-out infinite;
    }

    @keyframes bounce-arrow {
      0%, 100% {
        transform: translateY(-50%);
      }
      50% {
        transform: translateY(-40%);
      }
    }

    .select:disabled ~ .select-wrap::after,
    .select-wrap:has(.select:disabled)::after {
      border-top-color: #cbd5e1;
    }
  `}</style>

  <div 
    className="select-wrap"
    data-glow={ ( ( isActive && !selected[field] ) )? "true" : "false"}
    style={{ opacity }}
  >
    <select
      className="select"
      disabled={disabled}
      value={selected[field] ?? ""}
      onChange={(e) => handleChange(field, e.target.value)}
    >
      <option value="" disabled>
        {label || "Select option"}
      </option>

      {sortOptions(dropdowns[field]).map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
</>


            
          );
        })}
        {fields.length > 0 && fields.every((f) => dropdowns[f].length >0) && fields.every((f) => selected[f]) && (
            <Button loading={isButtonLoading}  sx={{ mt: 3, minWidth:'200px', minHeight:'45px', ...buttonStyles,

        backgroundColor: 'black',
    color: 'white',

    '&:hover': {
      backgroundColor: 'rgb(244, 108, 21)',
    },
             }} onClick={saveAndSubmit}
              hoverBackgroundColor="rgb(244, 108, 21)" 
            >
                {buttonLabel}
            </Button>
        )}
      </Stack>


    </Box>
  );
}
