// ==============================================================================
// TITAN 3D STUDIO — CUSTOM ESP32-S3 SOLO MINER ENCLOSURE (OpenSCAD Model)
// Progettazione 3D Parametrica con Griglia Esagonale REALE a Nido d'Ape
// ==============================================================================

// --- PARAMETRI DIMENSIONALI (in mm) ---
board_length = 58.5;     // Lunghezza PCB ESP32-S3
board_width = 28.5;      // Larghezza PCB ESP32-S3
board_thickness = 1.6;   // Spessore PCB
comp_height_top = 6.0;   // Altezza componenti superiori
comp_height_bot = 3.0;   // Altezza componenti inferiori
wall_thickness = 2.0;    // Spessore pareti scocca PLA
clearance = 0.6;         // Tolleranza incastro

inner_l = board_length + clearance;
inner_w = board_width + clearance;
inner_h = comp_height_top + comp_height_bot + board_thickness + clearance;

outer_l = inner_l + (wall_thickness * 2);
outer_w = inner_w + (wall_thickness * 2);
outer_h = inner_h + (wall_thickness * 2);

$fn = 60;

// --- MODULO PER SINGOLO ESAGONO NIDO D'APE ---
module hex_cell(r, h) {
    cylinder(r = r, h = h, $fn = 6, center = true);
}

// --- MODULO GRIGLIA A NIDO D'APE ESAGONALE COMPLETA ---
module honeycomb_grid(width, length, hex_r, wall, height) {
    x_spacing = (hex_r * sqrt(3)) + wall;
    y_spacing = (hex_r * 1.5) + (wall * 0.5);
    
    for (y = [-length/2 : y_spacing : length/2]) {
        row = round(y / y_spacing);
        x_offset = (abs(row) % 2 == 1) ? x_spacing / 2 : 0;
        
        for (x = [-width/2 + x_offset : x_spacing : width/2 - x_offset]) {
            translate([x, y, 0])
                rotate([0, 0, 30])
                    hex_cell(r = hex_r, h = height);
        }
    }
}

// --- MODULO BASE: CASE INFERIORE CON NIDO D'APE ---
module bottom_case() {
    difference() {
        // Blocco esterno arrotondato
        minkowski() {
            cube([outer_l - 4, outer_w - 4, outer_h / 2], center = true);
            cylinder(r = 2, h = 0.1);
        }

        // Cavità interna per ESP32-S3
        translate([0, 0, wall_thickness / 2])
            cube([inner_l, inner_w, outer_h], center = true);

        // Porta USB-C di alimentazione
        translate([-outer_l / 2 + 1, 0, 0])
            cube([wall_thickness * 3, 11, 7], center = true);

        // GRIGLIA A NIDO D'APE ESAGONALE INFERIORE
        translate([0, 0, -outer_h/4])
            honeycomb_grid(width = inner_l - 8, length = inner_w - 6, hex_r = 2.4, wall = 1.0, height = wall_thickness * 3);
    }

    // Supporti d'appoggio interni PCB
    translate([-inner_l/2 + 4, -inner_w/2 + 4, -outer_h/4 + 1.5])
        cylinder(r = 2.2, h = comp_height_bot, center = true);
    translate([inner_l/2 - 4, -inner_w/2 + 4, -outer_h/4 + 1.5])
        cylinder(r = 2.2, h = comp_height_bot, center = true);
    translate([-inner_l/2 + 4, inner_w/2 - 4, -outer_h/4 + 1.5])
        cylinder(r = 2.2, h = comp_height_bot, center = true);
    translate([inner_l/2 - 4, inner_w/2 - 4, -outer_h/4 + 1.5])
        cylinder(r = 2.2, h = comp_height_bot, center = true);
}

// --- MODULO COPERCHIO SUPERIORE CON NIDO D'APE & LOGO TITAN 3D ---
module top_cover() {
    translate([0, outer_w + 18, 0]) {
        difference() {
            // Blocco esterno coperchio
            minkowski() {
                cube([outer_l - 4, outer_w - 4, outer_h / 2], center = true);
                cylinder(r = 2, h = 0.1);
            }

            // Cavità interna per incastro a scatto
            translate([0, 0, -wall_thickness / 2])
                cube([inner_l - 0.2, inner_w - 0.2, outer_h], center = true);

            // GRIGLIA A NIDO D'APE ESAGONALE SUPERIORE
            translate([0, 0, outer_h/4])
                honeycomb_grid(width = inner_l - 8, length = inner_w - 6, hex_r = 2.4, wall = 1.0, height = wall_thickness * 3);

            // LOGO INCISO "TITAN 3D"
            translate([0, 0, outer_h/4 - 0.5])
                linear_extrude(height = 1.5)
                    text("TITAN 3D", size = 4.2, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
        }
    }
}

// RENDERING COMPLETO
bottom_case();
top_cover();
