#!/bin/bash
cd "$(dirname "$0")"
cd web
SKIP_PREFLIGHT_CHECK=true npm start
