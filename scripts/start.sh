#!/usr/bin/env bash
# ==============================================================================
# Script di Avvio dei Container Docker su Raspberry Pi
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Avvio dei servizi Docker (Cloud + Web Server)...${NC}"

docker compose up -d

echo -e "\n${GREEN}Servizi avviati con successo!${NC}"
echo -e "Accedi ai tuoi servizi:"
echo -e " - Portale principale / Web Server: ${BLUE}http://<IP-RASPBERRY>${NC}"
echo -e " - Cloud Personale (Nextcloud):    ${BLUE}http://<IP-RASPBERRY>/cloud${NC} (o http://<IP-RASPBERRY>:8080)"
