
C8 ?= component

build:
	$(C8) build

dist:
	$(C8) build --standalone -n woop -o .

clean:
	rm -rf build
	rm -rf components

.PHONY: build
