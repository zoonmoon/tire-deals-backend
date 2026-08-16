function normalizeVehiclePart(value) {

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

}


export function generateVehicleSearch(vehicle) {

  const variants = new Set();


  const year =
    normalizeVehiclePart(vehicle.Year);

  const make =
    normalizeVehiclePart(vehicle.Make);

  const model =
    normalizeVehiclePart(vehicle.Model);

  const submodel =
    normalizeVehiclePart(vehicle.Submodel);

  const body =
    normalizeVehiclePart(vehicle.Body);

  const doors =
    normalizeVehiclePart(vehicle.Doors);


  // ==================================================
  // Individual parts
  // ==================================================

  if (year) variants.add(year);
  if (make) variants.add(make);
  if (model) variants.add(model);
  if (submodel) variants.add(submodel);
  if (body) variants.add(body);
  if (doors) variants.add(doors);


  // ==================================================
  // Normal combinations
  // ==================================================

  if (make && model) {

    variants.add(
      `${make} ${model}`
    );

  }


  if (model && submodel) {

    variants.add(
      `${model} ${submodel}`
    );

  }


  if (make && model && submodel) {

    variants.add(
      `${make} ${model} ${submodel}`
    );

  }


  if (year && make && model) {

    variants.add(
      `${year} ${make} ${model}`
    );

  }


  if (year && make && model && submodel) {

    variants.add(
      `${year} ${make} ${model} ${submodel}`
    );

  }


  if (make && model && submodel && body) {

    variants.add(
      `${make} ${model} ${submodel} ${body}`
    );

  }


  if (
    year &&
    make &&
    model &&
    submodel &&
    body &&
    doors
  ) {

    variants.add(
      `${year} ${make} ${model} ${submodel} ${body} ${doors}`
    );

  }


  // ==================================================
  // NO-SPACE combinations
  //
  // Allows:
  //
  // Porsche911
  // ToyotaCamry
  // Porsche911Carrera
  // ==================================================

  if (make && model) {

    variants.add(
      `${make}${model}`
    );

  }


  if (model && submodel) {

    variants.add(
      `${model}${submodel}`
    );

  }


  if (make && model && submodel) {

    variants.add(
      `${make}${model}${submodel}`
    );

  }


  if (year && make && model) {

    variants.add(
      `${year}${make}${model}`
    );

  }


  if (year && make && model && submodel) {

    variants.add(
      `${year}${make}${model}${submodel}`
    );

  }


  return Array.from(variants).join(" ");

}