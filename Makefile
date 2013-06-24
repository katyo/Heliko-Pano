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

debug.render: debug.svg
	mkdir -p $@
	for i in `seq 6`; do inkscape -i layer$$i -j -C -e $@/$$i.jpg $<; done

server:
	@/usr/sbin/nginx -p . -c ./nginx.conf
	@echo 'Run browsers and navigate to http://localhost:8042/src/devel.html'
	@echo 'Press any key for complete...'
	@read r; kill `cat ./nginx.pid`
