/* SPOKES Print slides.
   Prints a lesson's slides as a workbook from the pictures listed in
   print/manifest.js (window.SPOKES_PRINT_MANIFEST), which
   scripts/capture-print-slides.mjs writes. Loaded after print/manifest.js. */
(function (root) {
  "use strict";

  const LAYOUTS = Object.freeze({
    notes: Object.freeze({ perPage: 1, orientation: "portrait", label: "Slide with note lines" }),
    two: Object.freeze({ perPage: 2, orientation: "portrait", label: "Two slides per page" }),
    full: Object.freeze({ perPage: 1, orientation: "landscape", label: "One full slide per page" })
  });
  const VERSIONS = Object.freeze({
    student: Object.freeze({ label: "Student workbook" }),
    teacher: Object.freeze({ label: "Teacher copy" })
  });
  const NOT_MADE = "Printable slides have not been made for this lesson yet.";
  const DAMAGED = "This lesson's list of printable slides is damaged. Ask the curriculum team to retake the print pictures.";

  function pictureLabel(picture) {
    return picture.label ? "Slide " + picture.slide + ", " + picture.label : "Slide " + picture.slide;
  }

  function picturesFor(manifest, version) {
    if (!VERSIONS[version]) throw new Error("Unknown version: " + version);
    return manifest.pictures
      .filter(function (picture) { return version === "teacher" || picture.student !== null; })
      .map(function (picture) {
        return {
          src: version === "teacher" ? picture.teacher : picture.student,
          label: pictureLabel(picture),
          slide: picture.slide,
          width: picture.width,
          height: picture.height
        };
      });
  }

  function buildPages(manifest, version, layout) {
    if (!LAYOUTS[layout]) throw new Error("Unknown layout: " + layout);
    const pictures = picturesFor(manifest, version);
    const perPage = LAYOUTS[layout].perPage;
    const pages = [{ kind: "cover" }];
    for (let i = 0; i < pictures.length; i += perPage) {
      pages.push({ kind: "slides", pictures: pictures.slice(i, i + perPage) });
    }
    return pages;
  }

  function isPath(value) {
    return typeof value === "string" && value !== "";
  }

  function manifestProblem(manifest) {
    if (!manifest || !Array.isArray(manifest.pictures) || manifest.pictures.length === 0) return NOT_MADE;
    const valid = typeof manifest.lessonTitle === "string" && manifest.pictures.every(function (picture) {
      return Number.isInteger(picture.slide) && picture.slide > 0 &&
        isPath(picture.teacher) && (picture.student === null || isPath(picture.student));
    });
    return valid ? null : DAMAGED;
  }

  function versionProblem(manifest, version) {
    return picturesFor(manifest, version).length === 0
      ? "The " + VERSIONS[version].label.toLowerCase() + " has no slides to print."
      : null;
  }

  const api = Object.freeze({
    LAYOUTS: LAYOUTS,
    VERSIONS: VERSIONS,
    pictureLabel: pictureLabel,
    picturesFor: picturesFor,
    buildPages: buildPages,
    manifestProblem: manifestProblem,
    versionProblem: versionProblem
  });

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SpokesPrintSlides = api;
})(typeof window !== "undefined" ? window : globalThis);
