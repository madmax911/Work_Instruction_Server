#!/bin/bash

for (( ;; ))
do
  echo Starting node $* at `date`
  node $*
done
