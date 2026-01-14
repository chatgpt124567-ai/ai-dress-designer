# Fabric Samples Directory

This directory contains the placeholder image used in the fabric preview feature of the questionnaire.

## Fabric Images Location

The actual fabric images are located in the `public` folder (parent directory):

1. **SATIN FABRIC.png** - Satin fabric sample
2. **SILK FABRIC.png** - Silk fabric sample
3. **CHIFFON FABRIC.png** - Chiffon fabric sample
4. **TULLE FABRIC.png** - Tulle fabric sample
5. **LACE FABRIC.png** - Lace fabric sample
6. **VELVET FABRIC.png** - Velvet fabric sample
7. **ORGANZA FABRIC.png** - Organza fabric sample
8. **CREPE FABRIC.png** - Crepe fabric sample

## Placeholder Image

This directory contains:
- **placeholder.svg** - Fallback image displayed when a fabric image is not found

## Usage

These images are displayed in the `FabricPreviewModal` component when users click the info icon (ℹ️) next to fabric options in the questionnaire (Question 2 - Fabric Type).

## Fallback Behavior

If a fabric image is not found in the `public` folder, the system will automatically use `placeholder.svg` from this directory as a fallback image.

