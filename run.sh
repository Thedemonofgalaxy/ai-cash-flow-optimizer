#!/usr/bin/env bash
# CashPulse AI - Minimalist Cash Flow Optimizer Starter

echo "========================================================"
echo "      CashPulse AI - Minimalist Cash Flow Optimizer"
echo "========================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found."
    exit 1
fi

echo "Starting server on http://127.0.0.1:8050 ..."
echo "API Docs: http://127.0.0.1:8050/docs"
echo ""

python3 app.py
