import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Slide,
  Checkbox
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function CategoryFilters({
  categories = [],
  collectionID,
  showCategoriesWithIDs,
  handleAttributeItemClick,
  attributeKey,
  attributeLabel
}) {



  // ------------------------------------
  // STATE
  // ------------------------------------
  const [currentCategories, setCurrentCategories] = useState(categories);
  const [history, setHistory] = useState([]);
  const [currentParent, setCurrentParent] = useState(null);
  const [direction, setDirection] = useState("left");
  const [selectedLeafIds, setSelectedLeafIds] = useState([]);

  useEffect(() =>{
    setCurrentCategories(categories)
  }, [categories])


const countMap = new Map(
  showCategoriesWithIDs.map(({ value, count }) => [
    String(value),
    count
  ])
);


const findCategoryById = (nodes, id) => {
  for (const node of nodes) {
    if (String(node.id) === String(id)) return node;
    if (node.children?.length) {
      const found = findCategoryById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};


const findFirstMultiChildCategory = (nodes = []) => {
  if (!showCategoriesWithIDs || showCategoriesWithIDs.length === 0) {
    return null;
  }

  const allowedIds = new Set(
    showCategoriesWithIDs.map(({ value }) => String(value))
  );

  for (const node of nodes) {
    if (!Array.isArray(node.children)) continue;

    const allowedChildren = node.children.filter(child =>
      allowedIds.has(String(child.id))
    );

    // ✅ FOUND BRANCH
    if (allowedChildren.length > 1) {
      return node;
    }

    // 🔁 KEEP DRILLING IF ONLY ONE OPTION
    if (allowedChildren.length === 1) {
      const deeper = findFirstMultiChildCategory(allowedChildren);
      if (deeper) return deeper;
    }
  }

  return null;
};




useEffect(() => {
  if (collectionID) {
    const category = findCategoryById(categories, collectionID);
    if (category) {
      setHistory([
        { categories, parent: null }
      ]);
      setCurrentParent(category);
      setCurrentCategories(category.children || []);
      return;
    }
  }

  const autoParent = collectionID.toString().trim().length > 0 
    ? findFirstMultiChildCategory(categories)
    : false
  

  if (autoParent) {
    setHistory([
      { categories, parent: null } // 👈 THIS LINE FIXES BACK
    ]);
    setCurrentParent(autoParent);
    setCurrentCategories(autoParent.children);
  } else {
    setHistory([]);
    setCurrentParent(null);
    setCurrentCategories(categories);
  }
}, [collectionID, categories, showCategoriesWithIDs]);


  // ------------------------------------
  // NAVIGATION CLICK
  // ------------------------------------
  const handleCategoryClick = (category) => {
    const hasChildren =
      Array.isArray(category.children) &&
      category.children.length > 0;

    if (hasChildren) {
      setDirection("left");
      setHistory(prev => [
        ...prev,
        { categories: currentCategories, parent: currentParent }
      ]);
      setCurrentCategories(category.children);
      setCurrentParent(category);
    } else {
      toggleLeaf(category);
    }
  };

  // ------------------------------------
  // BACK
  // ------------------------------------
  const handleBack = () => {
    if (!history.length) return;

    setDirection("right");
    const last = history[history.length - 1];
    setCurrentCategories(last.categories);
    setCurrentParent(last.parent);
    setHistory(prev => prev.slice(0, -1));
  };

  // ------------------------------------
  // LEAF TOGGLE ONLY
  // ------------------------------------
  const toggleLeaf = (category) => {
    setSelectedLeafIds(prev =>
      prev.includes(category.id)
        ? prev.filter(id => id !== category.id)
        : [...prev, category.id]
    );

    handleAttributeItemClick?.(
      attributeKey,
      attributeLabel,
      category.id
    );
  };

  // ------------------------------------
  // RENDER
  // ------------------------------------
  return (
    <Box sx={{ overflow: "hidden" }}>
      {(currentParent || history.length > 0) && (
        <Box
          onClick={handleBack}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            mb: 1,
            pb: 0.5,
            borderBottom: "1px solid rgba(0,0,0,0.05)"
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 16, mr: 1 }} />
          <Typography sx={{ fontWeight: "bold", 

            whiteSpace:'nowrap',
            overflow:'hidden',
            textOverflow:'ellipsis'
           }}>
            {currentParent ? currentParent.name : "Categories"}
          </Typography>
        </Box>
      )}

      <Slide
        direction={direction}
        in
        mountOnEnter
        unmountOnExit
        timeout={300}
        key={currentParent?.id || "root"}
      >
        <List sx={{ maxHeight: 250, overflowY: "auto" }} disablePadding>
          {
          
          [...currentCategories]
  .sort((a, b) => {
    const countA = countMap.get(String(a.id)) ?? 0;
    const countB = countMap.get(String(b.id)) ?? 0;

    // 1️⃣ sort by count (DESC)
    if (countA !== countB) {
      return countB - countA;
    }

    // 2️⃣ fallback: alphabetical
    return a.name.localeCompare(b.name);
  })
          .map(cat => {

            console.log("showCategoriesWithIDs", showCategoriesWithIDs);
            console.log("cat.id", cat.id);


            const isLeaf =
              !cat.children || cat.children.length === 0;

            const checked = selectedLeafIds.includes(cat.id);

            if(!showCategoriesWithIDs.map(({value}) => value ).includes(cat.id.toString())) return null

            // if (cat?.name?.toLowerCase().includes('other')) return <></>;

            return (
              <ListItemButton
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                  {isLeaf && (
                    <Checkbox
                      size="small"
                      checked={checked}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLeaf(cat);
                      }}
                      sx={{ mr: 1, p: 0.5 }}
                    />
                  )}

                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: 14 }}>
                        {cat.name}
                      </Typography>
                    }
                  />
                </Box>

                {!isLeaf && (
                  <KeyboardArrowDownIcon
                    sx={{ transform: "rotate(-90deg)", opacity: 0.6 }}
                  />
                )}

                {
                    isLeaf && (
                        <>
                      {countMap.has(String(cat.id)) && (
                        <Typography sx={{ fontSize: '13px' }}>({countMap.get(String(cat.id))})</Typography>
                      )}
                      </>

                    )
                }
              </ListItemButton>
            );
          })}
        </List>
      </Slide>
    </Box>
  );
}
