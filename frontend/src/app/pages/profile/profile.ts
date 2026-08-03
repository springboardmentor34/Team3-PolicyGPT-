import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
  CommonModule,
  RouterModule,
  FormsModule,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule
],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent {

  userName = 'Sri';

  user = {

    fullName: 'Sri',

    email: 'sri@gmail.com',

    mobile: '+91 1234632347',

    aadhaar: 'XXXX XXXX 4567',

    dob: '15 June 2004',

    gender: 'Male',

    state: 'Tamil Nadu',

    district: 'Salem'

  };

  statistics = {

    applications: 12,

    approved: 8,

    pending: 3,

    saved: 15

  };

  isEditing = false;

originalUser:any;

editProfile(){

  this.originalUser = {...this.user};

  this.isEditing = true;

}

saveProfile(){

  this.isEditing = false;

  alert("Profile Updated Successfully");

}

cancelEdit(){

  this.user = {...this.originalUser};

  this.isEditing = false;

}

  changePassword() {

    alert('Change Password');

  }

  notificationSettings() {

    alert('Notification Preferences');

  }

  downloadProfile() {

    alert('Downloading Profile...');

  }

  logout() {

    alert('Logged Out Successfully');

  }

}