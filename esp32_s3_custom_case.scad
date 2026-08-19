// ==============================================================================
// TITAN 3D STUDIO — CUSTOM ESP32-S3 SOLO MINER ENCLOSURE (OpenSCAD Model v2)
// Fori Esagonali Passanti Giganti a Nido d'Ape (100% Visibili Sopra e Sotto)
// ==============================================================================

// --- PARAMETRI DIMENSIONALI (in mm) ---
board_length = 58.5;     // Lunghezza PCB ESP32-S3
board_width = 28.5;      // Larghezza PCB ESP32-S3
board_thickness = 1.6;   // Spessore PCB
comp_height_top = 6.0;   // Altezza componenti superiori
comp_height_bot = 3.0;   // Altezza componenti inferiori
wall_thickness = 2.4;    // Spessore pareti scocca PLA
clearance = 0.8;         // Tolleranza incastro

inner_l = board_length + clearance;
inner_w = board_width + clearance;
inner_h = comp_height_top + comp_height_bot + board_thickness;

outer_l = inner_l + (wall_thickness * 2);
outer_w = inner_w + (wall_thickness * 2);
outer_h = inner_h + (wall_thickness * 2);

$fn = 40;

// Modulo Scatola Arrotondata Solida
module rounded_box(l, w, h, r) {
    hull() {
        translate([-l/2 + r, -w/2 + r, 0]) cylinder(r=r, h=h, center=true);
        translate([ l/2 - r, -w/2 + r, 0]) cylinder(r=r, h=h, center=true);
        translate([-l/2 + r,  w/2 - r, 0]) cylinder(r=r, h=h, center=true);
        translate([ l/2 - r,  w/2 - r, 0]) cylinder(r=r, h=h, center=true);
    }
}

// --- MODULO GRIGLIA NIDO D'APE PASSANTE GIGANTE ---
module honeycomb_grid(width, length, hex_r, wall) {
    x_spacing = (hex_r * sqrt(3)) + wall;
    y_spacing = (hex_r * 1.5) + (wall * 0.5);
    
    for (y = [-length/2 : y_spacing : length/2]) {
        row = round(y / y_spacing);
        x_offset = (abs(row) % 2 == 1) ? x_spacing / 2 : 0;
        
        for (x = [-width/2 + x_offset : x_spacing : width/2 - x_offset]) {
            translate([x, y, 0])
                rotate([0, 0, 30])
                    cylinder(r = hex_r, h = 50, $fn = 6, center = true); // Altezza 50mm per bucare da parte a parte!
        }
    }
}

// --- MODULO BASE INFERIORE (BOTTOM CASE) ---
module bottom_case() {
    difference() {
        // Scocca Esterna
        rounded_box(outer_l, outer_w, outer_h / 2, 3);

        // Cavità Interna
        translate([0, 0, wall_thickness / 2])
            cube([inner_l, inner_w, outer_h / 2], center = true);

        // Scasso USB-C
        translate([-outer_l / 2 + 1, 0, 0])
            cube([wall_thickness * 3, 12, 8], center = true);

        // FORI PASSANTI GIGANTI A NIDO D'APE SUL FONDO (SOTTO)
        honeycomb_grid(width = inner_l - 10, length = inner_w - 8, hex_r = 3.0, wall = 1.2);
    }

    // Supporti d'appoggio PCB
    translate([-inner_l/2 + 4, -inner_w/2 + 4, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 4, -inner_w/2 + 4, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([-inner_l/2 + 4,  inner_w/2 - 4, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
    translate([ inner_l/2 - 4,  inner_w/2 - 4, -outer_h/4 + 2]) cylinder(r = 2.5, h = comp_height_bot, center = true);
}

// --- MODULO COPERCHIO SUPERIORE (TOP COVER) ---
module top_cover() {
    translate([0, outer_w + 20, 0]) {
        difference() {
            // Coperchio Esterno
            rounded_box(outer_l, outer_w, outer_h / 2, 3);

            // Cavità Incastro
            translate([0, 0, -wall_thickness / 2])
                cube([inner_l - 0.2, inner_w - 0.2, outer_h / 2], center = true);

            // FORI PASSANTI GIGANTI A NIDO D'APE SUL COPERCHIO (SOPRA)
            honeycomb_grid(width = inner_l - 10, length = inner_w - 8, hex_r = 3.0, wall = 1.2);

            // LOGO INCISO TITAN 3D
            translate([0, 0, outer_h/4 - 0.4])
                linear_extrude(height = 2)
                    text("TITAN 3D", size = 4.5, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
        }
    }
}

// RENDERING COMPLETO
bottom_case();
top_cover();
