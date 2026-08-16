function normalizeSizePart(value) {

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .trim();

}


export function generateSizeSearch(tire) {

  const variants = new Set();

  const r = "r";


  // ==================================================
  // METRIC
  //
  // SectionWidth / AspectRatio / RimDiameter
  //
  // Example:
  //
  // 205/55R16
  //
  // 205
  // 55
  // R
  // 16
  // ==================================================

  const sw =
    normalizeSizePart(tire.SectionWidth);

  const ar =
    normalizeSizePart(tire.AspectRatio);

  const metricRim =
    normalizeSizePart(tire.RimDiameter);


  if (
    sw &&
    ar &&
    metricRim
  ) {

    // ==================================================
    // Individual parts
    // ==================================================

    variants.add(sw);

    variants.add(ar);

    variants.add(r);

    variants.add(metricRim);


    // ==================================================
    // 2-part combinations
    // ==================================================

    variants.add(
      `${sw}${ar}`
    );

    variants.add(
      `${ar}${r}`
    );

    variants.add(
      `${r}${metricRim}`
    );

    variants.add(
      `${sw}${r}`
    );


    // ==================================================
    // 3-part combinations
    // ==================================================

    variants.add(
      `${sw}${ar}${r}`
    );

    variants.add(
      `${ar}${r}${metricRim}`
    );

    variants.add(
      `${sw}${r}${metricRim}`
    );

    variants.add(
      `${sw}${ar}${metricRim}`
    );


    // ==================================================
    // Complete normalized size
    //
    // 20555r16
    // ==================================================

    variants.add(
      `${sw}${ar}${r}${metricRim}`
    );


    // ==================================================
    // Human-readable combinations
    // ==================================================

    variants.add(
      `${sw} ${ar}`
    );

    variants.add(
      `${ar} ${r} ${metricRim}`
    );

    variants.add(
      `${sw} ${ar} ${r}`
    );

    variants.add(
      `${sw} ${ar} ${r} ${metricRim}`
    );

  }


  // ==================================================
  // FLOTATION
  //
  // Diameter / InchWidth / RimDiameter
  //
  // Example:
  //
  // 33x12.50R20
  //
  // Diameter   = 33
  // X          = x
  // InchWidth  = 12.50
  // R          = r
  // Rim        = 20
  // ==================================================

  const diameter =
    normalizeSizePart(tire.Diameter);

  const inchWidth =
    normalizeSizePart(tire.InchWidth);

  const flotationRim =
    normalizeSizePart(tire.RimDiameter);


  if (
    diameter &&
    inchWidth &&
    flotationRim
  ) {

    const x = "x";


    // ==================================================
    // Individual parts
    // ==================================================

    variants.add(diameter);

    variants.add(inchWidth);

    variants.add(x);

    variants.add(r);

    variants.add(flotationRim);


    // ==================================================
    // 2-part combinations
    // ==================================================

    variants.add(
      `${diameter}${x}`
    );

    variants.add(
      `${x}${inchWidth}`
    );

    variants.add(
      `${inchWidth}${r}`
    );

    variants.add(
      `${r}${flotationRim}`
    );

    variants.add(
      `${diameter}${inchWidth}`
    );

    variants.add(
      `${inchWidth}${flotationRim}`
    );

    variants.add(
      `${diameter}${flotationRim}`
    );


    // ==================================================
    // 3-part combinations
    // ==================================================

    variants.add(
      `${diameter}${x}${inchWidth}`
    );

    variants.add(
      `${inchWidth}${r}${flotationRim}`
    );

    variants.add(
      `${diameter}${x}${flotationRim}`
    );

    variants.add(
      `${diameter}${inchWidth}${r}`
    );

    variants.add(
      `${diameter}${inchWidth}${flotationRim}`
    );


    // ==================================================
    // 4-part combinations
    // ==================================================

    variants.add(
      `${diameter}${x}${inchWidth}${r}`
    );

    variants.add(
      `${diameter}${x}${inchWidth}${flotationRim}`
    );

    variants.add(
      `${diameter}${inchWidth}${r}${flotationRim}`
    );


    // ==================================================
    // Complete normalized size
    //
    // 3312.50r20
    // ==================================================

    variants.add(
      `${diameter}${x}${inchWidth}${r}${flotationRim}`
    );

    variants.add(
      `${diameter}${inchWidth}${r}${flotationRim}`
    );


    // ==================================================
    // Human-readable combinations
    // ==================================================

    variants.add(
      `${diameter} ${inchWidth}`
    );

    variants.add(
      `${diameter} ${x} ${inchWidth}`
    );

    variants.add(
      `${inchWidth} ${r} ${flotationRim}`
    );

    variants.add(
      `${diameter} ${x} ${inchWidth} ${r}`
    );

    variants.add(
      `${diameter} ${x} ${inchWidth} ${r} ${flotationRim}`
    );

  }


  // ==================================================
  // Return search vocabulary
  // ==================================================

  return Array.from(variants).join(" ");

}