#!/usr/bin/env bash
# ==============================================================================
# Script di Installazione e Ottimizzazione per Raspberry Pi 4 (2GB RAM)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Setup Raspberry Pi 4: Dual Server (Cloud + Web)   ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Aggiornamento pacchetti sistema
echo -e "\n${YELLOW}[1/4] Aggiornamento dei pacchetti di sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Ottimizzazione SWAP a 2048MB (Cruciale per 2GB RAM)
echo -e "\n${YELLOW}[2/4] Ottimizzazione memoria SWAP a 2048MB...${NC}"
if [ -f /etc/dphys-swapfile ]; then
    echo "Configurazione file dphys-swapfile..."
    sudo sed -i 's/^CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
    sudo /etc/init.d/dphys-swapfile restart
    echo -e "${GREEN}Swap aumentato con successo a 2GB!${NC}"
else
    echo "Servizio dphys-swapfile non presente, proseguo..."
fi

# 3. Installazione Docker & Docker Compose
echo -e "\n${YELLOW}[3/4] Verifica e installazione Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installazione Docker in corso..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installato con successo!${NC}"
else
    echo -e "${GREEN}Docker è già installato!${NC}"
fi

# Installazione Docker Compose Plugin
sudo apt install -y docker-compose-plugin

# 4. Creazione delle cartelle di dati e permessi
echo -e "\n${YELLOW}[4/4] Configurazione dei file e permessi...${NC}"
if [ ! -f .env ]; then
    echo "Creazione file .env da .env.example..."
    cp .env.example .env
fi

chmod +x scripts/start.sh

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}   Installazione completata con successo!            ${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "Per avviare il server esegui:"
echo -e "${BLUE}   ./scripts/start.sh${NC}\n"
