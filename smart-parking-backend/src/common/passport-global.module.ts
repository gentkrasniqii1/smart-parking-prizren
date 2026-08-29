import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

// Guard-et (JwtAuthGuard, JwtRefreshGuard, RolesGuard) përdoren via
// @UseGuards() nëpër module të ndryshme (zones, spots, etj.) dhe Nest i
// instancion me injector-in e modulit pritës — jo të AuthModule. Pa
// PassportModule.register() të disponueshëm globalisht, DI dështon me
// "can't resolve dependencies ... AuthModuleOptions" sapo një guard
// përdoret jashtë AuthModule.
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  exports: [PassportModule],
})
export class PassportGlobalModule {}
