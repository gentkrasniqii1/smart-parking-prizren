import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleProfile } from '../../modules/auth/types/google-profile.type.js';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // Mbishkruan sjelljen default (hedh UnauthorizedException) — kur Google
  // OAuth dështon (p.sh. useri anulon consent-in), lëmë controller-in ta
  // trajtojë vetë me një redirect miqësor te frontend-i, jo JSON 401.
  handleRequest<TUser = GoogleProfile>(
    _err: unknown,
    user: TUser,
  ): TUser {
    return user;
  }
}
