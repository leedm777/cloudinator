all: build
.PHONY: all

build:
	docker build -t cfn-dsl .
.PHONY: build
