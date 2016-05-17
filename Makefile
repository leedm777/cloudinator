all: build
.PHONY: all

build:
	docker build -t cloudinator .
.PHONY: build
