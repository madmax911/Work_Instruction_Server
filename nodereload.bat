@echo off

prompt #

:reload
echo Starting node %* at %time% ...
node %*
goto reload