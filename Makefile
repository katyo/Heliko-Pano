#pv3dswc = $(wildcard Papervision3D_2*.swc)
swfopts += -swf-version 9 -lib sandy -debug #--no-traces

all: build
	@echo Complete..

%.swf: %.hx
	@echo Build $@..
	@haxe -swf $@ -main $* $(swfopts) $<
target.build += CubePano.swf

swf.clean:
	@rm -f *.swf
target.clean += swf.clean

prepare: $(target.prepare)
	@echo Complete: $^

build: $(target.build)
	@echo Complete: $^

clean: $(target.clean)
	@echo Complete: $^

testswf: build
	@testswf CubePano.swf
